from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import time

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user
)

from app.db import models, schemas

from app.services.auth_service import (
    hash_password,
    verify_password
)

from app.services.custody_service import (
    log_login,
    log_failed_login,
    log_logout
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =====================================================
# Register
# =====================================================
@router.post("/register")
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    total_start = time.perf_counter()

    existing_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists."
        )

    existing_email = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists."
        )

    hash_start = time.perf_counter()
    password_hash = hash_password(user.password)
    hash_end = time.perf_counter()

    db_start = time.perf_counter()

    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=password_hash,
        role="officer"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    db_end = time.perf_counter()

    total_end = time.perf_counter()

    return {
        "message": "User registered successfully.",
        "role": new_user.role,

        "performance": {
            "password_hash_time_seconds": round(hash_end - hash_start, 6),
            "database_insert_time_seconds": round(db_end - db_start, 6),
            "total_execution_time_seconds": round(total_end - total_start, 6)
        }
    }


# =====================================================
# Login
# =====================================================
@router.post("/login")
def login(
    request: Request,
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):

    total_start = time.perf_counter()

    db_start = time.perf_counter()

    db_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()

    db_end = time.perf_counter()

    if db_user is None:

        log_failed_login(
            db=db,
            username=user.username,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", "Unknown")
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password."
        )

    verify_start = time.perf_counter()

    password_valid = verify_password(
        user.password,
        db_user.password_hash
    )

    verify_end = time.perf_counter()

    if not password_valid:

        log_failed_login(
            db=db,
            username=user.username,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", "Unknown")
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password."
        )

    jwt_start = time.perf_counter()

    token = create_access_token(
        {
            "sub": db_user.username
        }
    )

    jwt_end = time.perf_counter()

    log_start = time.perf_counter()

    log_login(
        db=db,
        username=db_user.username,
        user_id=db_user.id,
        role=db_user.role,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "Unknown")
    )

    log_end = time.perf_counter()

    total_end = time.perf_counter()

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": db_user.username,
        "role": db_user.role,

        "performance": {
            "database_query_time_seconds": round(db_end - db_start, 6),
            "password_verification_time_seconds": round(verify_end - verify_start, 6),
            "jwt_generation_time_seconds": round(jwt_end - jwt_start, 6),
            "login_logging_time_seconds": round(log_end - log_start, 6),
            "total_execution_time_seconds": round(total_end - total_start, 6)
        }
    }


# =====================================================
# Current User Profile
# =====================================================
@router.get("/me")
def my_profile(
    current_user=Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at
    }


# =====================================================
# Protected Route
# =====================================================
@router.get("/protected")
def protected(
    current_user=Depends(get_current_user)
):

    return {
        "message": "Authentication successful.",
        "username": current_user.username,
        "role": current_user.role
    }


# =====================================================
# Logout
# =====================================================
@router.post("/logout")
def logout(
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    start = time.perf_counter()

    log_logout(
        db=db,
        username=current_user.username,
        user_id=current_user.id,
        role=current_user.role,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "Unknown")
    )

    end = time.perf_counter()

    return {
        "message": "Logout successful.",
        "performance": {
            "logout_time_seconds": round(end - start, 6)
        }
    }