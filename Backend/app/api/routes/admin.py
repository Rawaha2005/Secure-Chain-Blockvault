from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.role_checker import admin_only
from app.db.models import User, FileRecord, Block
from app.db.custody_model import CustodyLog
from app.db.schemas import RoleUpdate

router = APIRouter(
    prefix="/admin",
    tags=["Administration"]
)


# =====================================================
# Dashboard Statistics
# =====================================================
@router.get("/statistics")
def statistics(

    db: Session = Depends(get_db),
    current_user=Depends(admin_only)

):

    return {

        "total_users": db.query(User).count(),

        "total_files": db.query(FileRecord).count(),

        "total_blocks": db.query(Block).count(),

        "total_custody_logs": db.query(CustodyLog).count()
    }


# =====================================================
# Get All Users
# =====================================================
@router.get("/users")
def get_users(

    db: Session = Depends(get_db),
    current_user=Depends(admin_only)

):

    users = db.query(User).all()

    result = []

    for user in users:

        result.append({

            "id": user.id,

            "username": user.username,

            "email": user.email,

            "role": user.role,

            "created_at": user.created_at

        })

    return {

        "total_users": len(result),

        "users": result

    }


# =====================================================
# Get One User
# =====================================================
@router.get("/users/{user_id}")
def get_user(

    user_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(admin_only)

):

    user = db.query(User).filter(

        User.id == user_id

    ).first()

    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found."

        )

    return {

        "id": user.id,

        "username": user.username,

        "email": user.email,

        "role": user.role,

        "created_at": user.created_at

    }


# =====================================================
# Change User Role
# =====================================================
@router.put("/users/{user_id}/role")
def change_role(

    user_id: int,

    role_data: RoleUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(admin_only)

):

    allowed_roles = [

        "admin",

        "investigator",

        "officer",

        "auditor"

    ]

    if role_data.role not in allowed_roles:

        raise HTTPException(

            status_code=400,

            detail="Invalid role."

        )

    user = db.query(User).filter(

        User.id == user_id

    ).first()

    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found."

        )

    user.role = role_data.role

    db.commit()

    db.refresh(user)

    return {

        "message": "Role updated successfully.",

        "username": user.username,

        "new_role": user.role

    }


# =====================================================
# Delete User
# =====================================================
@router.delete("/users/{user_id}")
def delete_user(

    user_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(admin_only)

):

    user = db.query(User).filter(

        User.id == user_id

    ).first()

    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found."

        )

    db.delete(user)

    db.commit()

    return {

        "message": "User deleted successfully."

    }