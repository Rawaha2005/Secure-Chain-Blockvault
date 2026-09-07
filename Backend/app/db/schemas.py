from pydantic import BaseModel, Field, EmailStr
from datetime import datetime


# =====================================================
# USER REGISTRATION
# =====================================================
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(..., min_length=4, max_length=72)


# =====================================================
# USER LOGIN
# =====================================================
class UserLogin(BaseModel):
    username: str
    password: str


# =====================================================
# JWT TOKEN RESPONSE
# =====================================================
class Token(BaseModel):
    access_token: str
    token_type: str


# =====================================================
# USER RESPONSE MODEL
# =====================================================
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# UPDATE USER ROLE
# =====================================================
class RoleUpdate(BaseModel):
    role: str


# =====================================================
# ENABLE / DISABLE USER
# =====================================================
class StatusUpdate(BaseModel):
    is_active: bool


# =====================================================
# ADMIN USER DETAILS
# =====================================================
class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
# =====================================
# Update Role
# =====================================
class RoleUpdate(BaseModel):
    role: str


# =====================================
# Activate / Deactivate User
# =====================================
class UserStatusUpdate(BaseModel):
    is_active: bool