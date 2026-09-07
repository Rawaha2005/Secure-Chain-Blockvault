from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base
import datetime


class CustodyLog(Base):
    __tablename__ = "custody_logs"

    # ==========================================
    # Primary Key
    # ==========================================
    id = Column(Integer, primary_key=True, index=True)

    # ==========================================
    # File Information
    # ==========================================
    file_id = Column(Integer)

    filename = Column(String(255))

    evidence_hash = Column(String(255))

    # ==========================================
    # User Information
    # ==========================================
    user_id = Column(Integer)

    username = Column(String(100))

    role = Column(String(50))

    # ==========================================
    # Action Information
    # ==========================================
    action = Column(String(100))

    reason = Column(String(255))

    status = Column(String(50))

    # ==========================================
    # Request Information
    # ==========================================
    ip_address = Column(String(100))

    user_agent = Column(String(500))

    endpoint = Column(String(255))

    http_method = Column(String(20))

    # ==========================================
    # Blockchain
    # ==========================================
    blockchain_hash = Column(String(255))

    # ==========================================
    # Custody Hash Chain
    # ==========================================
    previous_record_hash = Column(String(64))

    record_hash = Column(String(64))

    # ==========================================
    # Timestamp
    # ==========================================
    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )