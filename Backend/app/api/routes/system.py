from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import datetime

from app.core.database import get_db
from app.db.models import User, FileRecord, Block
from app.db.custody_model import CustodyLog
from app.services.blockchain_service import verify_chain
from app.services.malware_service import malware_scanner

router = APIRouter(
    prefix="/system",
    tags=["System"]
)


@router.get("/info")
@router.get("/status")
def get_system_status(
    db: Session = Depends(get_db),
):
    """
    Public telemetry and real-time operational status of the SecureChain platform.
    Used by Login portal, Dashboard telemetry, and health monitors.
    """
    # 1. DATABASE CONNECTIVITY
    database_status = "CONNECTED"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        database_status = "DISCONNECTED"

    # 2. REAL METRIC COUNTS FROM POSTGRESQL
    try:
        evidence_count = db.query(FileRecord).count()
    except Exception:
        evidence_count = 0

    try:
        user_count = db.query(User).count()
    except Exception:
        user_count = 0

    try:
        block_count = db.query(Block).count()
    except Exception:
        block_count = 0

    try:
        custody_count = db.query(CustodyLog).count()
    except Exception:
        custody_count = 0

    # 3. BLOCKCHAIN CRYPTOGRAPHIC STATUS
    is_chain_healthy = False
    try:
        is_chain_healthy = verify_chain(db)
        blockchain_status = "ONLINE" if is_chain_healthy else "TAMPER_DETECTED"
    except Exception:
        blockchain_status = "OFFLINE"

    # 4. MALWARE SCANNER ENGINE STATUS
    scanner_active = malware_scanner.is_clamd_running()
    scanner_name = "ClamAV Local Daemon" if scanner_active else "SecureChain Forensic Heuristic Engine"

    # 5. TAMPER DETECTION SYSTEM
    tamper_status = "ACTIVE" if (block_count > 0 and is_chain_healthy) else ("ALERT" if not is_chain_healthy else "WAITING")

    now_iso = datetime.datetime.utcnow().isoformat()

    return {
        "api": "ONLINE",
        "database": database_status,
        "blockchain": blockchain_status,
        "evidence_count": evidence_count,
        "block_count": block_count,
        "user_count": user_count,
        "custody_events": custody_count,
        "timestamp": now_iso,
        "system": {
            "blockchain": blockchain_status,
            "evidence_storage": database_status,
            "api_server": "ONLINE",
            "sha256_engine": "READY",
            "tamper_detection": tamper_status,
            "malware_scanner": f"READY ({scanner_name})",
            "scanner_engine": scanner_name,
            "is_clamav_daemon_running": scanner_active
        },
        "statistics": {
            "evidence": evidence_count,
            "evidence_count": evidence_count,
            "blocks": block_count,
            "block_count": block_count,
            "users": user_count,
            "user_count": user_count,
            "custody_logs": custody_count,
            "custody_events": custody_count,
        },
        "database_details": {
            "status": database_status,
            "provider": "PostgreSQL",
        },
        "blockchain_details": {
            "height": block_count,
            "integrity": "VALID" if is_chain_healthy else "INVALID",
            "chain_valid": is_chain_healthy
        }
    }
