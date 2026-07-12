from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    mrp = Column(Float, nullable=True)
    stock_status = Column(String, default="in_stock")  # in_stock | out_of_stock
    is_featured = Column(Boolean, default=False, server_default="false")
    is_weight_based = Column(Boolean, default=False, server_default="false")
    available_stock = Column(Integer, nullable=True)  # in grams if weight-based
    low_stock_threshold = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, server_default="true")
    unit = Column(String, default="Kg", nullable=False)
    image_url = Column(String, nullable=True)
    image_file_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("Category", back_populates="products")
    subcategory = relationship("Subcategory", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
