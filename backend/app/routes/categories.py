import re
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.category import Category
from app.schemas import CategoryOut, CategoryCreate, CategoryUpdate
from app.services.storage import save_image

router = APIRouter(prefix="/categories", tags=["categories"])


def make_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    return slug


@router.get("/", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.id).all()


@router.get("/{slug}", response_model=CategoryOut)
def get_category(slug: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.slug == slug).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.post("/", response_model=CategoryOut)
def create_category(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    slug = make_slug(name)
    existing = db.query(Category).filter(Category.slug == slug).first()
    if existing:
        slug = f"{slug}-{db.query(Category).count()}"
    
    cat = Category(name=name, slug=slug, description=description)
    
    if image and image.filename:
        try:
            res = save_image(image, folder="categories", resize_to=(512, 512))
            cat.image_url = res["url"]
            cat.image_file_id = res.get("file_id")
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{id}", response_model=CategoryOut)
def update_category(
    id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if name:
        cat.name = name
        cat.slug = make_slug(name)
    if description is not None:
        cat.description = description
        
    if image and image.filename:
        try:
            res = save_image(image, folder="categories", resize_to=(512, 512))
            cat.image_url = res["url"]
            cat.image_file_id = res.get("file_id")
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{id}")
def delete_category(
    id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted"}
