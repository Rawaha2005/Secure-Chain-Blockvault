from datetime import datetime, timedelta
import os

from dotenv import load_dotenv
from jose import JWTError, jwt

from fastapi import (
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.db.models import User

# =====================================================
# Load Environment Variables
# =====================================================
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
)

# =====================================================
# HTTP Bearer Authentication
# =====================================================
security = HTTPBearer()


# =====================================================
# Create JWT Token
# =====================================================
def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update(
        {
            "exp": expire
        }
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =====================================================
# Decode JWT
# =====================================================
def decode_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token."
        )


# =====================================================
# Get Current Logged-in User
# =====================================================
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    payload = decode_token(token)

    username = payload.get("sub")

    if username is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )

    user = db.query(User).filter(
        User.username == username
    ).first()

    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )
   
   
    # =====================================================
    # Prevent Disabled Users
    # =====================================================
    if not user.is_active:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled. Please contact the administrator."
        )

    return user


# =====================================================
# Verify Token (Backward Compatibility)
# =====================================================
def verify_token(
    current_user: User = Depends(get_current_user)
):

    return current_user.username


# =====================================================
# Admin Only
# =====================================================
def admin_only(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required."
        )

    return current_user


# =====================================================
# Investigator or Admin
# =====================================================
def investigator_or_admin(
    current_user: User = Depends(get_current_user)
):

    if current_user.role not in [
        "admin",
        "investigator"
    ]:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Investigator or Administrator access required."
        )

    return current_user


# =====================================================
# Auditor or Admin
# =====================================================
def auditor_or_admin(
    current_user: User = Depends(get_current_user)
):

    if current_user.role not in [
        "admin",
        "auditor"
    ]:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Auditor or Administrator access required."
        )

    return current_user


# =====================================================
# Any Authenticated User
# =====================================================
def authenticated_user(
    current_user: User = Depends(get_current_user)
):

    return current_user