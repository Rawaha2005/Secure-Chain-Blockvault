from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    Boolean
)

from app.core.database import Base
import datetime


# =====================================================
# USER TABLE
# =====================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    email = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    # Roles:
    # admin
    # investigator
    # officer
    # auditor
    role = Column(
        String(50),
        default="officer",
        nullable=False
    )

    # Active / Disabled account
    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow
    )


# =====================================================
# FILE TABLE
# =====================================================
class FileRecord(Base):
    __tablename__ = "files"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Unique Verification Identifier (e.g. SC-EVD-000007)
    verification_id = Column(
        String(50),
        unique=True,
        index=True,
        nullable=True
    )

    # Case Management Association
    case_number = Column(
        String(100),
        index=True,
        default="CASE-001"
    )

    description = Column(
        Text,
        nullable=True
    )

    filename = Column(
        String(255),
        nullable=False
    )

    file_hash = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    file_size_bytes = Column(
        Integer,
        default=0
    )

    mime_type = Column(
        String(100),
        default="application/octet-stream"
    )

    # Malware & Security Scan Metadata
    scan_status = Column(
        String(50),
        default="CLEAN"
    )

    scanner_name = Column(
        String(100),
        default="SecureChain Multi-Layer Security Engine"
    )

    threat_name = Column(
        String(255),
        nullable=True
    )

    scanned_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    # Cached Base64 QR Image
    qr_code_base64 = Column(
        Text,
        nullable=True
    )

    # Evidence owner
    owner_id = Column(Integer)

    owner_username = Column(
        String(100)
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )


# =====================================================
# BLOCKCHAIN TABLE
# =====================================================
class Block(Base):
    __tablename__ = "blocks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    index = Column(
        Integer,
        unique=True,
        nullable=False
    )

    timestamp = Column(
        String,
        nullable=False
    )

    data = Column(
        Text,
        nullable=False
    )

    previous_hash = Column(
        String,
        nullable=False
    )

    hash = Column(
        String,
        unique=True,
        nullable=False
    )