from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password: str):

    # 🔥 FIX: bcrypt limit protection
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password too long. Max allowed is 72 bytes.")

    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
from datetime import datetime, timedelta
from jose import jwt

# SECRET KEY (IMPORTANT - FYP LEVEL)
SECRET_KEY = "supersecretkey123"  # later move to .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt