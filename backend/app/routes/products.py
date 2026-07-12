import os
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_admin
from app.core.config import settings
from app.models.product import Product
from app.models.category import Category
from app.schemas import ProductOut, ProductListOut, ProductCreate, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


from app.services.storage import save_image, delete_image


@router.get("/", response_model=List[ProductListOut])
def list_products(
    category_id: Optional[int] = None,
    subcategory_id: Optional[int] = None,
    featured: Optional[bool] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,  # price_asc | price_desc
    db: Session = Depends(get_db),
):
    q = db.query(Product)
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if subcategory_id:
        q = q.filter(Product.subcategory_id == subcategory_id)
    if featured is not None:
        q = q.filter(Product.is_featured == featured)
    if is_active is not None:
        q = q.filter(Product.is_active == is_active)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    if sort == "price_asc":
        q = q.order_by(Product.price.asc())
    elif sort == "price_desc":
        q = q.order_by(Product.price.desc())
    else:
        q = q.order_by(Product.id.desc())
    return q.all()


@router.get("/{id}", response_model=ProductOut)
def get_product(id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductOut)
def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: float = Form(...),
    mrp: Optional[str] = Form(None),
    stock_status: str = Form("in_stock"),
    is_featured: bool = Form(False),
    is_weight_based: bool = Form(False),
    available_stock: Optional[int] = Form(None),
    low_stock_threshold: Optional[int] = Form(None),
    is_active: bool = Form(True),
    unit: str = Form("Kg"),
    category_id: int = Form(...),
    subcategory_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    image_url = None
    image_file_id = None
    if image and image.filename:
        try:
            res = save_image(image, folder="products")
            image_url = res["url"]
            image_file_id = res["file_id"]
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    product = Product(
        name=name,
        description=description,
        price=price,
        mrp=float(mrp) if mrp and mrp.strip() else None,
        stock_status=stock_status,
        is_featured=is_featured,
        is_weight_based=is_weight_based,
        available_stock=available_stock,
        low_stock_threshold=low_stock_threshold,
        is_active=is_active,
        unit=unit,
        category_id=category_id,
        subcategory_id=subcategory_id,
        image_url=image_url,
        image_file_id=image_file_id,
    )
    if product.available_stock is not None:
        if product.available_stock <= 0:
            product.stock_status = "out_of_stock"
        else:
            product.stock_status = "in_stock"
            
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{id}", response_model=ProductOut)
def update_product(
    id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    mrp: Optional[str] = Form(None),
    stock_status: Optional[str] = Form(None),
    is_featured: Optional[bool] = Form(None),
    is_weight_based: Optional[bool] = Form(None),
    available_stock: Optional[int] = Form(None),
    low_stock_threshold: Optional[int] = Form(None),
    is_active: Optional[bool] = Form(None),
    unit: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    subcategory_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if name is not None:
        product.name = name
    if description is not None:
        product.description = description
    if price is not None:
        product.price = price
    if mrp is not None:
        product.mrp = float(mrp) if mrp.strip() else None
    if is_featured is not None:
        product.is_featured = is_featured
    if is_weight_based is not None:
        product.is_weight_based = is_weight_based
    if available_stock is not None:
        product.available_stock = available_stock
        
    if product.available_stock is not None:
        if product.available_stock <= 0:
            product.stock_status = "out_of_stock"
        else:
            product.stock_status = "in_stock"
    elif stock_status is not None:
        product.stock_status = stock_status
        
    if low_stock_threshold is not None:
        product.low_stock_threshold = low_stock_threshold
    if is_active is not None:
        product.is_active = is_active
    if unit is not None:
        product.unit = unit
    if category_id is not None:
        product.category_id = category_id
    if subcategory_id is not None:
        product.subcategory_id = subcategory_id
    if image and image.filename:
        # Delete old image
        if product.image_url:
            delete_image(product.image_url, product.image_file_id)
        
        try:
            res = save_image(image, folder="products")
            product.image_url = res["url"]
            product.image_file_id = res["file_id"]
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{id}/image")
def delete_product_image(
    id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.image_url:
        delete_image(product.image_url, product.image_file_id)
        product.image_url = None
        product.image_file_id = None
        db.commit()
    return {"message": "Image deleted"}


@router.delete("/{id}")
def delete_product(
    id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.image_url:
        delete_image(product.image_url, product.image_file_id)
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}
