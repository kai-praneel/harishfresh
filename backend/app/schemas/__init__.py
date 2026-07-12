from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class SubcategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    category_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    created_at: datetime
    subcategories: List[SubcategoryOut] = []

    class Config:
        from_attributes = True


class CategorySimple(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True


# ── Subcategory ───────────────────────────────────────────────────────────────

class SubcategoryCreate(BaseModel):
    name: str
    category_id: int
    description: Optional[str] = None


class SubcategoryUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None


# ── Product ───────────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    mrp: Optional[float] = None
    stock_status: str = "in_stock"
    is_featured: bool = False
    is_weight_based: bool = False
    available_stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    is_active: bool = True
    unit: str = "Kg"
    category_id: int
    subcategory_id: Optional[int] = None
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    mrp: Optional[float] = None
    stock_status: Optional[str] = None
    is_featured: Optional[bool] = None
    is_weight_based: Optional[bool] = None
    available_stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    is_active: Optional[bool] = None
    unit: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    image_url: Optional[str] = None


class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    mrp: Optional[float] = None
    stock_status: str
    is_featured: bool = False
    is_weight_based: bool = False
    available_stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    is_active: bool = True
    unit: str
    image_url: Optional[str] = None
    category_id: int
    subcategory_id: Optional[int] = None
    category: Optional[CategorySimple] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProductListOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    mrp: Optional[float] = None
    stock_status: str
    is_featured: bool = False
    is_weight_based: bool = False
    available_stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    is_active: bool = True
    unit: str
    image_url: Optional[str] = None
    category_id: int
    subcategory_id: Optional[int] = None
    category: Optional[CategorySimple] = None

    class Config:
        from_attributes = True


# ── Order ─────────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)
    unit: str = "Kg"


class DeliveryValidationRequest(BaseModel):
    customer_latitude: float
    customer_longitude: float
    subtotal: float


class DeliveryValidationResponse(BaseModel):
    deliverable: bool
    distance_km: Optional[float]
    delivery_charge: float
    handling_charge: float
    message: Optional[str]


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=2)
    phone_number: str = Field(..., min_length=10)
    address: str = Field(..., min_length=10)
    house_no: Optional[str] = None
    street: Optional[str] = None
    landmark: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    delivery_notes: Optional[str] = None
    customer_latitude: Optional[float] = None
    customer_longitude: Optional[float] = None
    items: List[OrderItemCreate]


class OrderVerifyAndPlace(OrderCreate):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class OrderInitiateResponse(BaseModel):
    razorpay_order_id: str
    amount: float
    currency: str = "INR"


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_price: float
    quantity: int
    subtotal: float
    unit: str
    is_weight_based: bool

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    order_id: str
    customer_name: str
    phone_number: str
    address: str
    house_no: Optional[str]
    street: Optional[str]
    landmark: Optional[str]
    city: Optional[str]
    pincode: Optional[str]
    delivery_notes: Optional[str]
    customer_latitude: Optional[float]
    customer_longitude: Optional[float]
    delivery_distance_km: Optional[float]
    subtotal: float
    delivery_charge: float
    handling_charge: float
    total_amount: float
    status: str
    tracking_token: Optional[str] = None
    
    # Payment fields
    payment_method: Optional[str] = "cod"
    payment_status: Optional[str] = "pending"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    
    created_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True


class OrderListOut(BaseModel):
    id: int
    order_id: str
    customer_name: str
    phone_number: str
    subtotal: float
    delivery_charge: float
    handling_charge: float
    total_amount: float
    status: str
    created_at: datetime
    item_count: int = 0

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str

    @validator("status")
    def validate_status(cls, v):
        allowed = ["new", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v


# ── Settings ──────────────────────────────────────────────────────────────────

class SettingsOut(BaseModel):
    id: int
    whatsapp_number: str
    minimum_order_amount: float
    free_delivery_message: str
    bulk_order_message: str
    store_name: str
    store_address: str
    gmaps_link: Optional[str]
    store_latitude: Optional[float]
    store_longitude: Optional[float]
    free_delivery_radius_km: float
    max_delivery_radius_km: float
    delivery_charges_enabled: bool
    delivery_charge_model: str
    flat_delivery_fee: float
    delivery_charge_per_km: float
    handling_charge: float

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    whatsapp_number: Optional[str] = None
    minimum_order_amount: Optional[float] = None
    free_delivery_message: Optional[str] = None
    bulk_order_message: Optional[str] = None
    store_name: Optional[str] = None
    store_address: Optional[str] = None
    gmaps_link: Optional[str] = None
    store_latitude: Optional[float] = None
    store_longitude: Optional[float] = None
    free_delivery_radius_km: Optional[float] = None
    max_delivery_radius_km: Optional[float] = None
    delivery_charges_enabled: Optional[bool] = None
    delivery_charge_model: Optional[str] = None
    flat_delivery_fee: Optional[float] = None
    delivery_charge_per_km: Optional[float] = None
    handling_charge: Optional[float] = None


class ExtractLocationRequest(BaseModel):
    url: str

class ExtractLocationResponse(BaseModel):
    latitude: float
    longitude: float


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_products: int
    total_orders: int
    new_orders: int
    confirmed_orders: int
    delivered_orders: int
    cancelled_orders: int
    new_orders_count: int  # for notification polling
