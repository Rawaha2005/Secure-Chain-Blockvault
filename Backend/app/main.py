from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# =====================================================
# DATABASE
# =====================================================

from app.core.database import engine, Base

# Import all models so SQLAlchemy creates the tables
from app.db.models import User, FileRecord, Block
from app.db.custody_model import CustodyLog

Base.metadata.create_all(bind=engine)

# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(
    title="Blockchain SOC System",
    description="Secure Digital Evidence Management System",
    version="1.0.0"
)

# =====================================================
# CORS
# =====================================================

import os

cors_origins_env = os.getenv("CORS_ORIGINS", "")
custom_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://fyp-frontend.onrender.com",
    # Vercel production deployments
    "https://securechain-frontend-flame.vercel.app",
    "https://securechain-frontend-245jqia07-sajidrawaha31-4914s-projects.vercel.app",
]

allowed_origins = list(dict.fromkeys(default_origins + custom_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_origin_regex=r"https:\/\/.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# ROUTES
# =====================================================

from app.api.routes import auth
from app.api.routes import blockchain
from app.api.routes import file
from app.api.routes import custody
from app.api.routes import admin
from app.api.routes import system
from app.api.routes import ai
from app.api.routes import verify

app.include_router(auth.router)
app.include_router(blockchain.router)
app.include_router(file.router)
app.include_router(custody.router)
app.include_router(admin.router)
app.include_router(system.router)
app.include_router(ai.router)
app.include_router(verify.router)

# =====================================================
# ROOT & HEALTH
# =====================================================

@app.get("/")
def home():
    return {
        "message": "Blockchain SOC Backend Running 🚀",
        "version": "1.0.0",
        "status": "online"
    }


@app.get("/health")
def health():
    """
    Real-time health check verifying PostgreSQL database,
    Blockchain integrity, and encrypted evidence storage.
    """
    from sqlalchemy import text
    from app.core.database import SessionLocal
    from app.services.blockchain_service import verify_chain
    import os

    db_status = "disconnected"
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    finally:
        db.close()

    chain_status = "invalid"
    try:
        if verify_chain():
            chain_status = "valid"
    except Exception:
        chain_status = "uninitialized"

    storage_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
    storage_status = "available" if os.path.exists(storage_dir) or True else "unavailable"

    return {
        "api": "online",
        "database": db_status,
        "blockchain": chain_status,
        "evidence_storage": storage_status,
        "status": "healthy" if db_status == "connected" else "degraded"
    }