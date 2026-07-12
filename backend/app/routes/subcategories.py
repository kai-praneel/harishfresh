import re
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.subcategory import Subcategory
from app.models.category import Category
from app.schemas import SubcategoryOut, SubcategoryCreate, SubcategoryUpdate

router = APIRouter(prefix="/subcategories", tags=["subcategories"])


def make_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    return slug


@router.get("/", response_model=List[SubcategoryOut])
def list_subcategories(category_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Subcategory)
    if category_id:
        q = q.filter(Subcategory.category_id == category_id)
    return q.order_by(Subcategory.id).all()


@router.get("/{slug}", response_model=SubcategoryOut)
def get_subcategory(slug: str, db: Session = Depends(get_db)):
    sub = db.query(Subcategory).filter(Subcategory.slug == slug).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    return sub


@router.post("/", response_model=SubcategoryOut)
def create_subcategory(
    body: SubcategoryCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == body.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    slug = make_slug(body.name)
    existing = db.query(Subcategory).filter(Subcategory.slug == slug).first()
    if existing:
        slug = f"{slug}-{db.query(Subcategory).count()}"
    sub = Subcategory(name=body.name, slug=slug, category_id=body.category_id, description=body.description)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.put("/{id}", response_model=SubcategoryOut)
def update_subcategory(
    id: int,
    body: SubcategoryUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    sub = db.query(Subcategory).filter(Subcategory.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    if body.name:
        sub.name = body.name
        sub.slug = make_slug(body.name)
    if body.category_id:
        sub.category_id = body.category_id
    if body.description is not None:
        sub.description = body.description
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{id}")
def delete_subcategory(
    id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    sub = db.query(Subcategory).filter(Subcategory.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    db.delete(sub)
    db.commit()
    return {"message": "Subcategory deleted"}
