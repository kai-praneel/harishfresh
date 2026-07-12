from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    whatsapp_number = Column(String, default="917396896009")
    minimum_order_amount = Column(Float, default=200.0)
    free_delivery_message = Column(String, default="Free delivery within 5km")
    bulk_order_message = Column(String, default="Hi, I want to place a bulk order.")
    store_name = Column(String, default="HarishFresh")
    store_address = Column(String, default="")
    
    # Delivery & Location Configuration
    gmaps_link = Column(String, nullable=True)
    store_latitude = Column(Float, nullable=True)
    store_longitude = Column(Float, nullable=True)
    free_delivery_radius_km = Column(Float, default=5.0)
    max_delivery_radius_km = Column(Float, default=15.0)
    delivery_charges_enabled = Column(Boolean, default=True)
    delivery_charge_model = Column(String, default="none")  # none, flat, per_km
    flat_delivery_fee = Column(Float, default=0.0)
    delivery_charge_per_km = Column(Float, default=10.0)
    handling_charge = Column(Float, default=0.0)
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
