from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.db.custody_model import CustodyLog
from app.services.custody_hash_service import calculate_custody_hash

router = APIRouter(
    prefix="/custody",
    tags=["Chain of Custody"]
)


# ======================================================
# Get All Custody Logs
# ======================================================
@router.get("/")
def get_all_logs(
    db: Session = Depends(get_db)
):

    logs = db.query(CustodyLog).order_by(
        CustodyLog.id
    ).all()

    return {
        "total_logs": len(logs),
        "logs": logs
    }


# ======================================================
# Verify Entire Custody Chain
# ======================================================
@router.get("/verify-chain")
def verify_chain(
    db: Session = Depends(get_db)
):

    logs = db.query(CustodyLog).order_by(
        CustodyLog.id
    ).all()

    if len(logs) == 0:

        return {
            "chain_valid": True,
            "message": "No custody records found."
        }

    previous_hash = "GENESIS"

    for log in logs:

        # -----------------------------------
        # Verify Previous Hash
        # -----------------------------------
        if log.previous_record_hash != previous_hash:

            return {
                "chain_valid": False,
                "tampered_record": log.id,
                "reason": "Previous hash mismatch."
            }

        # -----------------------------------
        # Recalculate Hash
        # -----------------------------------
        hash_data = {
            "file_id": log.file_id,
            "filename": log.filename,
            "evidence_hash": log.evidence_hash,
            "user_id": log.user_id,
            "username": log.username,
            "role": log.role,
            "action": log.action,
            "reason": log.reason,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "endpoint": log.endpoint,
            "http_method": log.http_method,
            "blockchain_hash": log.blockchain_hash,
            "status": log.status,
            "previous_record_hash": log.previous_record_hash
        }

        calculated_hash = calculate_custody_hash(
            hash_data
        )

        # -----------------------------------
        # Verify Record Hash
        # -----------------------------------
        if calculated_hash != log.record_hash:

            return {
                "chain_valid": False,
                "tampered_record": log.id,
                "reason": "Record hash mismatch."
            }

        previous_hash = log.record_hash

    return {
        "chain_valid": True,
        "total_records": len(logs),
        "message": "Custody chain is valid."
    }


# ======================================================
# Get Custody History of One File
# ======================================================
@router.get("/file/{file_id}")
def file_history(
    file_id: int,
    db: Session = Depends(get_db)
):

    logs = db.query(CustodyLog).filter(
        CustodyLog.file_id == file_id
    ).order_by(
        CustodyLog.created_at
    ).all()

    return {
        "file_id": file_id,
        "events": logs
    }