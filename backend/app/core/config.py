from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ADMIN_USERNAME: str = 'example_user'
    ADMIN_PASSWORD: str = "nani1410"
    UPLOAD_DIR: str = "uploads"
    FRONTEND_URL: str = "https://shelter-lawrence-combining-complement.trycloudflare.com"
    CORS_ORIGINS: str = "https://shelter-lawrence-combining-complement.trycloudflare.com"
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    STORAGE_PROVIDER: str = "local" # local or imagekit
    IMAGEKIT_PUBLIC_KEY: str = ""
    IMAGEKIT_PRIVATE_KEY: str = ""
    IMAGEKIT_URL_ENDPOINT: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
