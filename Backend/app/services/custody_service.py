from app.db.custody_model import CustodyLog
from app.services.custody_hash_service import calculate_custody_hash


# =====================================================
# Generic Chain of Custody Logger
# =====================================================
def log_custody_event(
    db,
    action,
    status="SUCCESS",

    file_id=None,
    filename=None,
    evidence_hash=None,
    blockchain_hash=None,

    username="System",
    user_id=None,
    role="System",

    reason="",

    ip_address="Unknown",
    user_agent="Unknown",
    endpoint="",
    http_method=""
):
    """
    Generic logger for every action performed in the system with cryptographic chain linkage.
    """

    last_log = db.query(CustodyLog).order_by(CustodyLog.id.desc()).first()
    previous_record_hash = last_log.record_hash if (last_log and last_log.record_hash) else "GENESIS"

    hash_data = {
        "file_id": file_id,
        "filename": filename,
        "evidence_hash": evidence_hash,
        "user_id": user_id,
        "username": username,
        "role": role,
        "action": action,
        "reason": reason,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "endpoint": endpoint,
        "http_method": http_method,
        "blockchain_hash": blockchain_hash,
        "status": status,
        "previous_record_hash": previous_record_hash
    }

    record_hash = calculate_custody_hash(hash_data)

    log = CustodyLog(
        file_id=file_id,
        filename=filename,
        evidence_hash=evidence_hash,

        user_id=user_id,
        username=username,
        role=role,

        action=action,
        reason=reason,

        ip_address=ip_address,
        user_agent=user_agent,

        endpoint=endpoint,
        http_method=http_method,

        blockchain_hash=blockchain_hash,
        status=status,
        previous_record_hash=previous_record_hash,
        record_hash=record_hash
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log


# =====================================================
# Upload
# =====================================================
def log_upload(
    db,
    file_id,
    filename,
    evidence_hash,
    blockchain_hash,

    username="System",
    user_id=None,
    role="System",

    reason="Initial Evidence Upload",

    ip_address="Unknown",
    user_agent="Unknown",
    endpoint="",
    http_method=""
):

    return log_custody_event(
        db=db,
        action="UPLOAD_EVIDENCE",
        status="SUCCESS",

        file_id=file_id,
        filename=filename,
        evidence_hash=evidence_hash,
        blockchain_hash=blockchain_hash,

        username=username,
        user_id=user_id,
        role=role,

        reason=reason,

        ip_address=ip_address,
        user_agent=user_agent,
        endpoint=endpoint,
        http_method=http_method
    )


# =====================================================
# Download
# =====================================================
def log_download(
    db,
    file_id,
    filename,
    evidence_hash,

    username="System",
    user_id=None,
    role="System",

    reason="Evidence Download",

    ip_address="Unknown",
    user_agent="Unknown",
    endpoint="",
    http_method=""
):

    return log_custody_event(
        db=db,
        action="DOWNLOAD_EVIDENCE",
        status="SUCCESS",

        file_id=file_id,
        filename=filename,
        evidence_hash=evidence_hash,

        username=username,
        user_id=user_id,
        role=role,

        reason=reason,

        ip_address=ip_address,
        user_agent=user_agent,
        endpoint=endpoint,
        http_method=http_method
    )


# =====================================================
# Verify
# =====================================================
def log_verify(
    db,
    filename,
    evidence_hash,

    blockchain_hash="",

    username="System",
    user_id=None,
    role="System",

    reason="Evidence Verification",

    ip_address="Unknown",
    user_agent="Unknown",
    endpoint="",
    http_method="",

    status="SUCCESS"
):

    return log_custody_event(
        db=db,
        action="VERIFY_EVIDENCE",
        status=status,

        filename=filename,
        evidence_hash=evidence_hash,
        blockchain_hash=blockchain_hash,

        username=username,
        user_id=user_id,
        role=role,

        reason=reason,

        ip_address=ip_address,
        user_agent=user_agent,
        endpoint=endpoint,
        http_method=http_method
    )


# =====================================================
# Login
# =====================================================
def log_login(
    db,
    username,
    user_id,
    role,

    ip_address="Unknown",
    user_agent="Unknown",
    endpoint="",
    http_method=""
):

    return log_custody_event(
        db=db,
        action="LOGIN",
        status="SUCCESS",

        username=username,
        user_id=user_id,
        role=role,

        reason="User Login",

        ip_address=ip_address,
        user_agent=user_agent,
        endpoint=endpoint,
        http_method=http_method
    )


# =====================================================
# Failed Login
# =====================================================
def log_failed_login(
    db,
    username,

    ip_address="Unknown",
    user_agent="Unknown",
    endpoint="",
    http_method=""
):

    return log_custody_event(
        db=db,
        action="FAILED_LOGIN",
        status="FAILED",

        username=username,

        reason="Invalid Credentials",

        ip_address=ip_address,
        user_agent=user_agent,
        endpoint=endpoint,
        http_method=http_method
    )


# =====================================================
# Logout
# =====================================================
def log_logout(
    db,
    username,
    user_id,
    role,

    ip_address="Unknown",
    user_agent="Unknown",
    endpoint="",
    http_method=""
):

    return log_custody_event(
        db=db,
        action="LOGOUT",
        status="SUCCESS",

        username=username,
        user_id=user_id,
        role=role,

        reason="User Logout",

        ip_address=ip_address,
        user_agent=user_agent,
        endpoint=endpoint,
        http_method=http_method
    )