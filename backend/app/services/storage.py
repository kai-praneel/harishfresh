import os
import uuid
from fastapi import UploadFile
from imagekitio import ImageKit
from app.core.config import settings

# Initialize ImageKit if the provider is 'imagekit'
imagekit = None
if settings.STORAGE_PROVIDER == "imagekit":
    imagekit = ImageKit(
        private_key=settings.IMAGEKIT_PRIVATE_KEY
    )

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

def _get_extension(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"  # default if missing or invalid, although caller should validate
    return ext

def save_image(file: UploadFile, folder: str = "products") -> dict:
    """
    Saves an image to the configured storage provider.
    Returns a dictionary with 'url' and optionally 'file_id' (for ImageKit).
    """
    ext = _get_extension(file.filename)
    filename = f"{uuid.uuid4()}{ext}"

    if settings.STORAGE_PROVIDER == "imagekit":
        # ImageKit upload
        file_content = file.file.read()
        try:
            upload_resp = imagekit.files.upload(
                file=file_content,
                file_name=filename,
                folder=f"/harishfresh/{folder}/"
            )
            # Reset file cursor just in case it's used again
            file.file.seek(0)
            
            return {
                "url": upload_resp.url,
                "file_id": upload_resp.file_id
            }
        except Exception as e:
            file.file.seek(0)
            raise Exception(f"ImageKit upload failed: {str(e)}")

    else:
        # Local Storage upload
        path = os.path.join(settings.UPLOAD_DIR, folder, filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(file.file.read())
        
        # Reset file cursor
        file.file.seek(0)
        
        return {
            "url": f"/uploads/{folder}/{filename}",
            "file_id": None
        }

def delete_image(url: str, file_id: str = None) -> bool:
    """
    Deletes an image from the configured storage provider.
    """
    if not url:
        return True

    if settings.STORAGE_PROVIDER == "imagekit":
        if file_id:
            try:
                imagekit.files.delete(file_id=file_id)
                return True
            except Exception as e:
                print(f"Failed to delete from ImageKit: {str(e)}")
                return False
        return False
    else:
        # Local Storage delete
        path = url.replace("/uploads/", f"{settings.UPLOAD_DIR}/")
        if os.path.exists(path):
            try:
                os.remove(path)
                return True
            except Exception as e:
                print(f"Failed to delete local file: {str(e)}")
                return False
        return True
