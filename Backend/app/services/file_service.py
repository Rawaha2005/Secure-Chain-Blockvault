import os
import shutil
import hashlib
from fastapi import UploadFile

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


async def save_uploaded_file(file: UploadFile):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path


def calculate_file_hash(file_path):

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as f:

        while True:

            chunk = f.read(4096)

            if not chunk:
                break

            sha256.update(chunk)

    return sha256.hexdigest()


def delete_original_file(file_path):

    if os.path.exists(file_path):
        os.remove(file_path)