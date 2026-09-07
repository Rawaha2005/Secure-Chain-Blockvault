from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.db.models import FileRecord, Block
from app.services.blockchain_service import find_block_by_hash, verify_chain
from app.services.qr_service import get_verification_dossier, format_verification_id
from app.services.custody_service import log_custody_event

router = APIRouter(
    prefix="/verify",
    tags=["Verification"]
)


def get_request_metadata(request: Request):
    return {
        "ip_address": request.client.host if request.client else "Unknown",
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "endpoint": request.url.path,
        "http_method": request.method,
    }


@router.get("/{verification_id}")
def verify_by_qr_or_id(
    request: Request,
    verification_id: str,
    db: Session = Depends(get_db)
):
    """
    Public QR Code & Identifier Verification Endpoint.
    Resolves verification ID (e.g. SC-EVD-000007 or numeric ID),
    verifies against blockchain integrity, and returns full forensic dossier.
    """
    clean_id = verification_id.strip()

    # Query file record
    if clean_id.isdigit():
        file_rec = db.query(FileRecord).filter(FileRecord.id == int(clean_id)).first()
    else:
        file_rec = db.query(FileRecord).filter(FileRecord.verification_id.ilike(clean_id)).first()

    if not file_rec:
        meta = get_request_metadata(request)
        log_custody_event(
            db=db,
            action="QR_VERIFY_ATTEMPT",
            file_id=None,
            filename=None,
            evidence_hash=None,
            username="PUBLIC_AUDITOR",
            user_id=None,
            role="auditor",
            ip_address=meta["ip_address"],
            user_agent=meta["user_agent"],
            endpoint=meta["endpoint"],
            http_method=meta["http_method"],
            status="NOT_FOUND",
            reason=f"Verification ID '{clean_id}' does not exist in ledger"
        )
        raise HTTPException(
            status_code=404,
            detail={
                "error": "EVIDENCE_NOT_FOUND",
                "message": f"Evidence record with verification identifier '{clean_id}' was not found in the SecureChain registry.",
                "verification_status": "TAMPERED / NOT VERIFIED",
                "integrity_verdict": False
            }
        )

    # Cross-reference with blockchain
    block = find_block_by_hash(file_rec.file_hash, db)
    chain_valid = verify_chain()

    dossier = get_verification_dossier(
        file_record=file_rec,
        blockchain_block=block,
        is_chain_valid=chain_valid
    )

    meta = get_request_metadata(request)
    log_custody_event(
        db=db,
        action="QR_VERIFY_SUCCESS" if dossier["integrity_verdict"] else "QR_VERIFY_TAMPERED",
        file_id=file_rec.id,
        filename=file_rec.filename,
        evidence_hash=file_rec.file_hash,
        username="PUBLIC_AUDITOR",
        user_id=None,
        role="auditor",
        ip_address=meta["ip_address"],
        user_agent=meta["user_agent"],
        endpoint=meta["endpoint"],
        http_method=meta["http_method"],
        status="VERIFIED" if dossier["integrity_verdict"] else "TAMPERED",
        reason=f"QR verification lookup for {clean_id}"
    )

    return dossier


@router.get("/hash/{file_hash}")
def verify_by_hash(
    request: Request,
    file_hash: str,
    db: Session = Depends(get_db)
):
    """
    Direct SHA-256 Hash Lookup & Verification against Blockchain.
    """
    clean_hash = file_hash.strip().lower()
    file_rec = db.query(FileRecord).filter(FileRecord.file_hash == clean_hash).first()
    block = find_block_by_hash(clean_hash, db)
    chain_valid = verify_chain()

    is_verified = (file_rec is not None) and (block is not None) and chain_valid

    if not file_rec and not block:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "HASH_NOT_FOUND",
                "message": "The supplied SHA-256 digest does not match any registered block or file in the ledger.",
                "status": "TAMPERED / NOT VERIFIED",
                "verified": False
            }
        )

    return {
        "status": "VERIFIED" if is_verified else "TAMPERED / NOT VERIFIED",
        "verified": is_verified,
        "hash": clean_hash,
        "database_record_found": file_rec is not None,
        "blockchain_block_found": block is not None,
        "chain_valid": chain_valid,
        "evidence": {
            "id": file_rec.id if file_rec else None,
            "verification_id": file_rec.verification_id if file_rec else None,
            "filename": file_rec.filename if file_rec else (block.data if block else None),
            "uploaded_by": file_rec.owner_username if file_rec else None,
            "uploaded_at": file_rec.uploaded_at.isoformat() if file_rec and file_rec.uploaded_at else None,
            "block_index": block.index if block else None,
            "block_hash": block.hash if block else None
        }
    }
