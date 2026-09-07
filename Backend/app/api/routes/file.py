from io import BytesIO
import os
import hashlib
import datetime

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.role_checker import (
    upload_access,
    download_access,
    verify_access,
    authenticated_user,
)
from app.db.models import User, FileRecord, Block
from app.services.file_service import (
    save_uploaded_file,
    calculate_file_hash,
    delete_original_file,
)
from app.services.encryption_service import (
    encrypt_file,
    decrypt_file_to_bytes,
)
from app.services.blockchain_service import (
    add_file_to_chain,
    find_block_by_hash,
    verify_chain,
)
from app.services.custody_service import (
    log_upload,
    log_download,
    log_verify,
    log_custody_event,
)
from app.services.malware_service import (
    scan_uploaded_file,
    malware_scanner,
)
from app.services.qr_service import (
    generate_qr_code_base64,
    format_verification_id,
    get_verification_dossier,
)

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)


def get_request_metadata(request: Request):
    return {
        "ip_address": request.client.host if request.client else "Unknown",
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "endpoint": request.url.path,
        "http_method": request.method,
    }


# ===================================================
# 1. Upload File with Malware Scan, SHA-256, AES & QR
# ===================================================
@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    case_number: str = Form(default="CASE-001"),
    description: str = Form(default=""),
    db: Session = Depends(get_db),
    current_user: User = Depends(upload_access),
):
    clean_filename = malware_scanner.sanitize_filename(file.filename)

    # 1. Save original file temporarily
    file_path = await save_uploaded_file(file)

    # 2. MALWARE & SECURITY SCAN PIPELINE
    scan_result = scan_uploaded_file(file_path, clean_filename)

    if not scan_result.get("is_clean", True):
        # File failed security scan: DO NOT ENCRYPT, DO NOT SAVE, DELETE TEMP FILE
        delete_original_file(file_path)

        meta = get_request_metadata(request)
        threat = scan_result.get("threat_name", "Malicious.Payload.Detected")

        log_custody_event(
            db=db,
            action="UPLOAD_SECURITY_BLOCKED",
            file_id=None,
            filename=clean_filename,
            evidence_hash="UNREGISTERED",
            username=current_user.username,
            user_id=current_user.id,
            role=current_user.role,
            ip_address=meta["ip_address"],
            user_agent=meta["user_agent"],
            endpoint=meta["endpoint"],
            http_method=meta["http_method"],
            status="SECURITY_ALERT",
            reason=f"Security scan rejected file: Threat detected [{threat}]"
        )

        raise HTTPException(
            status_code=400,
            detail={
                "error": "MALWARE_DETECTED",
                "message": f"Security scan rejected file: Threat detected [{threat}]. File unencrypted and purged.",
                "security_scan": scan_result
            }
        )

    # 3. Calculate SHA-256 hash of original clean file
    original_hash = calculate_file_hash(file_path)

    # 4. Check duplicate hash in DB
    existing = db.query(FileRecord).filter(
        FileRecord.file_hash == original_hash
    ).first()

    if existing:
        delete_original_file(file_path)
        meta = get_request_metadata(request)
        log_custody_event(
            db=db,
            action="UPLOAD",
            file_id=existing.id,
            filename=clean_filename,
            evidence_hash=original_hash,
            username=current_user.username,
            user_id=current_user.id,
            role=current_user.role,
            ip_address=meta["ip_address"],
            user_agent=meta["user_agent"],
            endpoint=meta["endpoint"],
            http_method=meta["http_method"],
            status="FAILED",
            reason="Duplicate file uploaded"
        )
        raise HTTPException(
            status_code=400,
            detail="File with identical SHA-256 hash already exists in evidence registry."
        )

    # 5. Measure file size
    file_size_bytes = 0
    try:
        file_size_bytes = os.path.getsize(file_path)
    except Exception:
        pass

    # 6. Encrypt original file with AES-256 and delete unencrypted file
    encrypted_path = encrypt_file(file_path)
    delete_original_file(file_path)

    # 7. Record file entry in DB
    new_file = FileRecord(
        filename=clean_filename,
        file_hash=original_hash,
        file_path=encrypted_path,
        case_number=case_number or "CASE-001",
        description=description or "",
        file_size_bytes=file_size_bytes,
        mime_type=file.content_type or "application/octet-stream",
        scan_status=scan_result.get("status", "CLEAN"),
        scanner_name=scan_result.get("scanner_name", "SecureChain Multi-Layer Security Engine"),
        threat_name=scan_result.get("threat_name", None),
        scanned_at=datetime.datetime.utcnow(),
        owner_id=current_user.id,
        owner_username=current_user.username,
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    # 8. Assign standardized Verification ID & QR code
    verification_id = format_verification_id(new_file.id)
    qr_base64 = generate_qr_code_base64(verification_id)

    new_file.verification_id = verification_id
    new_file.qr_code_base64 = qr_base64
    db.commit()
    db.refresh(new_file)

    # 9. Add transaction block to Blockchain
    block = add_file_to_chain(
        {
            "filename": clean_filename,
            "hash": original_hash,
            "verification_id": verification_id,
            "case_number": case_number or "CASE-001",
            "owner": current_user.username,
            "timestamp": datetime.datetime.utcnow().isoformat()
        },
        db,
    )

    # 10. Log action to Chain of Custody
    meta = get_request_metadata(request)
    log_upload(
        db=db,
        file_id=new_file.id,
        filename=clean_filename,
        evidence_hash=original_hash,
        blockchain_hash=block.hash,
        username=current_user.username,
        user_id=current_user.id,
        role=current_user.role,
        ip_address=meta["ip_address"],
        user_agent=meta["user_agent"],
        endpoint=meta["endpoint"],
        http_method=meta["http_method"],
    )

    return {
        "message": "File verified clean, encrypted, and registered to blockchain successfully.",
        "file_id": new_file.id,
        "verification_id": verification_id,
        "filename": clean_filename,
        "case_number": new_file.case_number,
        "uploaded_by": current_user.username,
        "owner_id": current_user.id,
        "hash": original_hash,
        "block_index": block.index,
        "block_hash": block.hash,
        "qr_code": qr_base64,
        "security_scan": scan_result
    }


# ===================================================
# 2. Get All Files (with verification_id and scan info)
# ===================================================
@router.get("/")
def get_all_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(authenticated_user),
):
    if current_user.role in ["admin", "investigator", "auditor"]:
        files = db.query(FileRecord).order_by(FileRecord.id.desc()).all()
    else:
        files = db.query(FileRecord).filter(
            FileRecord.owner_id == current_user.id
        ).order_by(FileRecord.id.desc()).all()

    result = [
        {
            "id": f.id,
            "verification_id": f.verification_id or format_verification_id(f.id),
            "case_number": getattr(f, "case_number", "CASE-001") or "CASE-001",
            "description": getattr(f, "description", "") or "",
            "filename": f.filename,
            "hash": f.file_hash,
            "file_size_bytes": getattr(f, "file_size_bytes", 0) or 0,
            "scan_status": getattr(f, "scan_status", "CLEAN") or "CLEAN",
            "scanner_name": getattr(f, "scanner_name", "SecureChain Security Engine"),
            "uploaded_by": f.owner_username,
            "owner_id": f.owner_id,
            "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None,
            "has_qr": bool(f.qr_code_base64),
        }
        for f in files
    ]

    return {
        "total_files": len(result),
        "files": result,
    }


# ===================================================
# 3. Get File Details by ID
# ===================================================
@router.get("/{file_id}")
def get_file(
    request: Request,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(authenticated_user),
):
    file = db.query(FileRecord).filter(FileRecord.id == file_id).first()

    if not file:
        raise HTTPException(status_code=404, detail="Evidence file record not found.")

    if current_user.role not in ["admin", "investigator", "auditor"] and file.owner_id != current_user.id:
        meta = get_request_metadata(request)
        log_custody_event(
            db=db,
            action="VIEW_DETAILS",
            file_id=file.id,
            filename=file.filename,
            evidence_hash=file.file_hash,
            username=current_user.username,
            user_id=current_user.id,
            role=current_user.role,
            ip_address=meta["ip_address"],
            user_agent=meta["user_agent"],
            endpoint=meta["endpoint"],
            http_method=meta["http_method"],
            status="ACCESS_DENIED",
            reason="User attempted to view unowned evidence dossier"
        )
        raise HTTPException(status_code=403, detail="Access denied. Insufficient clearance to view this evidence dossier.")

    v_id = file.verification_id or format_verification_id(file.id)
    if not file.qr_code_base64:
        file.qr_code_base64 = generate_qr_code_base64(v_id)
        file.verification_id = v_id
        db.commit()

    # Look up blockchain block
    block = db.query(Block).filter(Block.data.ilike(f"%{file.file_hash}%")).first()

    return {
        "id": file.id,
        "verification_id": v_id,
        "case_number": getattr(file, "case_number", "CASE-001"),
        "description": getattr(file, "description", ""),
        "filename": file.filename,
        "hash": file.file_hash,
        "file_size_bytes": getattr(file, "file_size_bytes", 0),
        "mime_type": getattr(file, "mime_type", "application/octet-stream"),
        "scan_status": getattr(file, "scan_status", "CLEAN"),
        "scanner_name": getattr(file, "scanner_name", "SecureChain Multi-Layer Security Engine"),
        "threat_name": getattr(file, "threat_name", None),
        "scanned_at": file.scanned_at.isoformat() if getattr(file, "scanned_at", None) else None,
        "uploaded_by": file.owner_username,
        "owner_id": file.owner_id,
        "uploaded_at": file.uploaded_at.isoformat() if file.uploaded_at else None,
        "qr_code": file.qr_code_base64,
        "blockchain": {
            "block_index": block.index if block else None,
            "block_hash": block.hash if block else None,
            "previous_hash": block.previous_hash if block else None,
            "timestamp": block.timestamp if block else None
        }
    }


# ===================================================
# 4. Get QR Code for File
# ===================================================
@router.get("/{file_id}/qr")
def get_file_qr(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(authenticated_user),
):
    file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Evidence file record not found.")

    v_id = file.verification_id or format_verification_id(file.id)
    if not file.qr_code_base64:
        file.qr_code_base64 = generate_qr_code_base64(v_id)
        file.verification_id = v_id
        db.commit()

    return {
        "file_id": file.id,
        "verification_id": v_id,
        "filename": file.filename,
        "qr_code_base64": file.qr_code_base64,
        "verification_url": f"/verify/{v_id}"
    }


# ===================================================
# 5. Download Decrypted Evidence File
# ===================================================
@router.get("/download/{file_id}")
def download_file(
    request: Request,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(download_access),
):
    file = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Evidence file not found.")

    if current_user.role not in ["admin", "investigator", "auditor"] and file.owner_id != current_user.id:
        meta = get_request_metadata(request)
        log_custody_event(
            db=db,
            action="DOWNLOAD",
            file_id=file.id,
            filename=file.filename,
            evidence_hash=file.file_hash,
            username=current_user.username,
            user_id=current_user.id,
            role=current_user.role,
            ip_address=meta["ip_address"],
            user_agent=meta["user_agent"],
            endpoint=meta["endpoint"],
            http_method=meta["http_method"],
            status="ACCESS_DENIED",
            reason="User attempted to download unauthorized evidence"
        )
        raise HTTPException(status_code=403, detail="Access denied. Unauthorized download request.")

    if not os.path.exists(file.file_path):
        raise HTTPException(status_code=404, detail="Encrypted physical file missing from storage repository.")

    # Decrypt in-memory to stream
    decrypted_bytes = decrypt_file_to_bytes(file.file_path)

    meta = get_request_metadata(request)
    log_download(
        db=db,
        file_id=file.id,
        filename=file.filename,
        evidence_hash=file.file_hash,
        username=current_user.username,
        user_id=current_user.id,
        role=current_user.role,
        ip_address=meta["ip_address"],
        user_agent=meta["user_agent"],
        endpoint=meta["endpoint"],
        http_method=meta["http_method"],
    )

    return StreamingResponse(
        BytesIO(decrypted_bytes),
        media_type=getattr(file, "mime_type", "application/octet-stream") or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{file.filename}"'
        }
    )


# ===================================================
# 6. File Verification by Content (Bit-for-Bit)
# ===================================================
@router.post("/verify")
async def verify_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(authenticated_user),
):
    """
    Forensic verification: Computes SHA-256 hash of submitted file bytes
    and cross-checks against PostgreSQL and the Blockchain ledger.
    """
    content = await file.read()
    calculated_hash = hashlib.sha256(content).hexdigest()

    # Search DB for hash (case-insensitive)
    db_file = db.query(FileRecord).filter(
        FileRecord.file_hash.ilike(calculated_hash)
    ).first()

    # Search Blockchain for hash
    block = find_block_by_hash(calculated_hash, db)
    chain_valid = verify_chain(db)

    is_verified = (db_file is not None) and (block is not None) and chain_valid

    meta = get_request_metadata(request)
    log_verify(
        db=db,
        file_id=db_file.id if db_file else None,
        filename=file.filename,
        evidence_hash=calculated_hash,
        blockchain_hash=block.hash if block else None,
        username=current_user.username if current_user else "Auditor",
        user_id=current_user.id if current_user else None,
        role=current_user.role if current_user else "auditor",
        ip_address=meta["ip_address"],
        user_agent=meta["user_agent"],
        endpoint=meta["endpoint"],
        http_method=meta["http_method"],
        status="VERIFIED" if is_verified else "TAMPERED / MISMATCH"
    )

    if is_verified:
        message = "Evidence matches the blockchain record."
        status_text = "VERIFIED"
    elif db_file and not block:
        message = "File found in database, but corresponding blockchain block is missing or unverified."
        status_text = "NOT_VERIFIED"
    elif not db_file and block:
        message = "Blockchain block found, but database record is missing."
        status_text = "NOT_VERIFIED"
    elif not chain_valid:
        message = "Cryptographic blockchain integrity violation detected across the chain."
        status_text = "TAMPERED"
    else:
        message = "File does not match any registered evidence in the blockchain ledger."
        status_text = "NOT_VERIFIED"

    return {
        "status": status_text,
        "message": message,
        "verified": is_verified,
        "filename": db_file.filename if db_file else file.filename,
        "uploaded_hash": calculated_hash,
        "calculated_hash": calculated_hash,
        "hash": calculated_hash,
        "database_match": db_file is not None,
        "blockchain_match": block is not None,
        "block_index": block.index if block else None,
        "block_hash": block.hash if block else None,
        "blockchain_block_index": block.index if block else None,
        "blockchain_block_hash": block.hash if block else None,
        "chain_integrity": chain_valid,
        "evidence_details": {
            "id": db_file.id if db_file else None,
            "verification_id": db_file.verification_id if db_file else None,
            "original_filename": db_file.filename if db_file else None,
            "uploaded_by": db_file.owner_username if db_file else None,
            "uploaded_at": db_file.uploaded_at.isoformat() if (db_file and db_file.uploaded_at) else None,
            "block_index": block.index if block else None,
            "block_hash": block.hash if block else None,
            "case_number": getattr(db_file, "case_number", "CASE-001") if db_file else None,
        } if db_file else None
    }
