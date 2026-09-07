import os
import base64
from dotenv import load_dotenv
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

load_dotenv()

# Load AES key from .env
AES_KEY = base64.b64decode(os.getenv("AES_KEY"))

aesgcm = AESGCM(AES_KEY)


# ==========================================
# Encrypt File
# ==========================================
def encrypt_file(input_file_path: str):

    with open(input_file_path, "rb") as f:
        data = f.read()

    # Generate a random 12-byte nonce
    nonce = os.urandom(12)

    # Encrypt
    encrypted_data = aesgcm.encrypt(
        nonce,
        data,
        None
    )

    # Save encrypted file
    encrypted_path = input_file_path + ".enc"

    with open(encrypted_path, "wb") as f:
        f.write(nonce + encrypted_data)

    return encrypted_path


# ==========================================
# Decrypt File
# ==========================================
def decrypt_file(encrypted_file_path: str):

    with open(encrypted_file_path, "rb") as f:
        file_data = f.read()

    nonce = file_data[:12]
    encrypted_data = file_data[12:]

    decrypted_data = aesgcm.decrypt(
        nonce,
        encrypted_data,
        None
    )

    decrypted_path = encrypted_file_path.replace(".enc", "_decrypted")

    with open(decrypted_path, "wb") as f:
        f.write(decrypted_data)

    return decrypted_path

def decrypt_file_to_bytes(encrypted_file_path: str):

    with open(encrypted_file_path, "rb") as f:
        file_data = f.read()

    nonce = file_data[:12]
    encrypted_data = file_data[12:]

    decrypted_data = aesgcm.decrypt(
        nonce,
        encrypted_data,
        None
    )

    return decrypted_data