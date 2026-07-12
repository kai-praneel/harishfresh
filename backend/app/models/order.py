from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, nullable=False, index=True)
    tracking_token = Column(String, unique=True, nullable=True, index=True)
    customer_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    address = Column(Text, nullable=False)  # Kept for backwards compatibility
    
    # Structured Address
    house_no = Column(String, nullable=True)
    street = Column(String, nullable=True)
    landmark = Column(String, nullable=True)
    city = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    delivery_notes = Column(Text, nullable=True)
    
    # Location & Charges
    customer_latitude = Column(Float, nullable=True)
    customer_longitude = Column(Float, nullable=True)
    delivery_distance_km = Column(Float, nullable=True)
    subtotal = Column(Float, nullable=False, default=0.0)
    delivery_charge = Column(Float, nullable=False, default=0.0)
    handling_charge = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False)
    
    status = Column(String, default="new")  # new | confirmed | delivered | cancelled
    
    # Payment fields
    payment_method = Column(String, default="online")
    payment_status = Column(String, default="pending") # pending | paid | failed | refunded | cancelled
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String, nullable=False)
    product_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)
    unit = Column(String, nullable=False, default="Kg")
    is_weight_based = Column(Boolean, nullable=False, default=False, server_default="false")

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
