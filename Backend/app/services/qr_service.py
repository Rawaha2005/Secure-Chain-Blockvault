import io
import base64
import os
import qrcode
from qrcode.constants import ERROR_CORRECT_M
from PIL import Image

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://securechain-frontend-flame.vercel.app")


def format_verification_id(file_id: int) -> str:
    """
    Standardized SecureChain verification identifier (e.g. SC-EVD-000007).
    """
    return f"SC-EVD-{file_id:06d}"


def generate_qr_code_base64(verification_id: str, verification_url: str = None) -> str:
    """
    Generates a high-contrast forensic QR code encoding the verification URL.
    Returns base64 encoded PNG data URI.
    """
    if not verification_url:
        verification_url = f"{FRONTEND_URL}/verify/{verification_id}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#000000", back_color="#FFFFFF")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    png_bytes = buffer.getvalue()

    base64_str = base64.b64encode(png_bytes).decode("utf-8")
    return f"data:image/png;base64,{base64_str}"


def get_verification_dossier(file_record, blockchain_block=None, is_chain_valid=True) -> dict:
    """
    Builds the complete cryptographic verification dossier for QR lookup.
    """
    v_id = file_record.verification_id or format_verification_id(file_record.id)
    block_idx = blockchain_block.index if blockchain_block else None
    block_hash = blockchain_block.hash if blockchain_block else None
    prev_hash = blockchain_block.previous_hash if blockchain_block else None

    is_verified = (blockchain_block is not None) and is_chain_valid

    return {
        "verification_id": v_id,
        "file_id": file_record.id,
        "filename": file_record.filename,
        "file_hash": file_record.file_hash,
        "case_number": getattr(file_record, "case_number", "CASE-001") or "CASE-001",
        "description": getattr(file_record, "description", "") or "",
        "owner_username": file_record.owner_username,
        "uploaded_at": file_record.uploaded_at.isoformat() if file_record.uploaded_at else None,
        "file_size_bytes": getattr(file_record, "file_size_bytes", 0) or 0,
        "mime_type": getattr(file_record, "mime_type", "application/octet-stream") or "application/octet-stream",
        "blockchain": {
            "block_index": block_idx,
            "block_hash": block_hash,
            "previous_block_hash": prev_hash,
            "chain_valid": is_chain_valid,
            "status": "VALID" if is_chain_valid and blockchain_block else "UNVERIFIED"
        },
        "security_scan": {
            "status": getattr(file_record, "scan_status", "CLEAN") or "CLEAN",
            "scanner_name": getattr(file_record, "scanner_name", "SecureChain Multi-Layer Security Engine") or "SecureChain Multi-Layer Security Engine",
            "threat_name": getattr(file_record, "threat_name", None),
            "scanned_at": file_record.scanned_at.isoformat() if getattr(file_record, "scanned_at", None) else None
        },
        "verification_status": "VERIFIED" if is_verified else "TAMPERED / NOT VERIFIED",
        "integrity_verdict": is_verified,
        "verification_url": f"{FRONTEND_URL}/verify/{v_id}"
    }
