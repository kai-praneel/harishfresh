import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.database import Base, engine
from app.core.config import settings
from app.routes import auth, categories, subcategories, products, orders, settings as settings_router, delivery

# Guard create_all so it only runs if the database doesn't exist yet (for fresh installs)
# Production instances will use alembic migrations
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HarishFresh API",
    description="Backend API for HarishFresh grocery ordering platform",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
os.makedirs("uploads/products", exist_ok=True)
os.makedirs("uploads/banners", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(subcategories.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(delivery.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "HarishFresh API", "status": "running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
