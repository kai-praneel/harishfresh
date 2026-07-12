import secrets
import uuid
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.settings import Settings
from app.schemas import OrderCreate, OrderOut, OrderListOut, OrderStatusUpdate, DashboardStats
from app.utils.location import calculate_haversine_distance, calculate_charges

router = APIRouter(prefix="/orders", tags=["orders"])


def generate_order_id() -> str:
    return f"HF{str(uuid.uuid4().int)[:8].upper()}"



import razorpay
from app.schemas import OrderInitiateResponse, OrderVerifyAndPlace


@router.post("/", response_model=OrderOut)
def place_order(body: OrderCreate, db: Session = Depends(get_db)):
    settings_db = db.query(Settings).first()
    min_amount = settings_db.minimum_order_amount if settings_db else 200.0

    if not body.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    subtotal = 0.0
    order_items_data = []

    for item in body.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            
        if product.available_stock is not None:
            if product.available_stock < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"'{product.name}' is currently out of stock. Please review your cart before placing the order."
                )
            product.available_stock -= item.quantity
            if product.available_stock <= 0:
                product.stock_status = "out_of_stock"
        elif product.stock_status == "out_of_stock":
            raise HTTPException(
                status_code=400, 
                detail=f"'{product.name}' is currently out of stock. Please review your cart before placing the order."
            )
            
        if product.is_weight_based:
            item_subtotal = (product.price * item.quantity) / 1000.0
        else:
            item_subtotal = product.price * item.quantity
            
        subtotal += item_subtotal
        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_price": product.price,
            "quantity": item.quantity,
            "subtotal": item_subtotal,
            "unit": product.unit,
            "is_weight_based": product.is_weight_based,
        })

    if subtotal < min_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order amount is ₹{min_amount:.0f}",
        )
        
    distance_km = None
    if settings_db and settings_db.store_latitude and settings_db.store_longitude and body.customer_latitude and body.customer_longitude:
        distance_km = calculate_haversine_distance(
            settings_db.store_latitude, 
            settings_db.store_longitude,
            body.customer_latitude, 
            body.customer_longitude
        )
        
    charges = calculate_charges(distance_km, subtotal, settings_db) if settings_db else {
        "deliverable": True,
        "distance_km": None,
        "delivery_charge": 0.0,
        "handling_charge": 0.0
    }
    
    if not charges["deliverable"]:
        raise HTTPException(status_code=400, detail=charges["message"] or "Delivery not available to this location.")
        
    total = subtotal + charges["delivery_charge"] + charges["handling_charge"]

    order = Order(
        order_id=generate_order_id(),
        customer_name=body.customer_name,
        phone_number=body.phone_number,
        address=body.address,
        customer_latitude=body.customer_latitude,
        customer_longitude=body.customer_longitude,
        delivery_distance_km=charges["distance_km"],
        subtotal=subtotal,
        delivery_charge=charges["delivery_charge"],
        handling_charge=charges["handling_charge"],
        total_amount=total,
        status="new",
        payment_method="cod",
        payment_status="pending",
            tracking_token=secrets.token_urlsafe(32),
    )
    db.add(order)
    db.flush()

    for item_data in order_items_data:
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)

    db.commit()
    db.refresh(order)
    return order

@router.post("/initiate-payment"
, response_model=OrderInitiateResponse)
def initiate_payment(body: OrderCreate, db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    min_amount = settings.minimum_order_amount if settings else 200.0

    if not body.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    subtotal = 0.0
    for item in body.items:
        # Initial validation without locking or deducting
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            
        if product.available_stock is not None:
            if product.available_stock < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"'{product.name}' is currently out of stock. Please review your cart before placing the order."
                )
        elif product.stock_status == "out_of_stock":
            raise HTTPException(
                status_code=400, 
                detail=f"'{product.name}' is currently out of stock. Please review your cart before placing the order."
            )
            
        if product.is_weight_based:
            item_subtotal = (product.price * item.quantity) / 1000.0
        else:
            item_subtotal = product.price * item.quantity
            
        subtotal += item_subtotal

    if subtotal < min_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order amount is ₹{min_amount:.0f}",
        )
        
    distance_km = None
    if settings and settings.store_latitude and settings.store_longitude and body.customer_latitude and body.customer_longitude:
        distance_km = calculate_haversine_distance(
            settings.store_latitude, 
            settings.store_longitude,
            body.customer_latitude, 
            body.customer_longitude
        )
        
    charges = calculate_charges(distance_km, subtotal, settings) if settings else {
        "deliverable": True,
        "distance_km": None,
        "delivery_charge": 0.0,
        "handling_charge": 0.0
    }
    
    if not charges["deliverable"]:
        raise HTTPException(status_code=400, detail=charges["message"] or "Delivery not available to this location.")
        
    total = subtotal + charges["delivery_charge"] + charges["handling_charge"]

    # Initialize Razorpay client and create order
    from app.core.config import settings as app_settings
    
    if not app_settings.RAZORPAY_KEY_ID or not app_settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Payment gateway is not configured")

    client = razorpay.Client(auth=(app_settings.RAZORPAY_KEY_ID, app_settings.RAZORPAY_KEY_SECRET))
    rzp_order = client.order.create({
        "amount": int(total * 100),
        "currency": "INR",
        "payment_capture": "1"
    })

    return OrderInitiateResponse(
        razorpay_order_id=rzp_order['id'],
        amount=total,
        currency="INR"
    )

@router.post("/verify-and-place", response_model=OrderOut)
def verify_and_place(body: OrderVerifyAndPlace, db: Session = Depends(get_db)):
    from app.core.config import settings as app_settings
    
    # 1. Verify Razorpay Signature
    client = razorpay.Client(auth=(app_settings.RAZORPAY_KEY_ID, app_settings.RAZORPAY_KEY_SECRET))
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': body.razorpay_order_id,
            'razorpay_payment_id': body.razorpay_payment_id,
            'razorpay_signature': body.razorpay_signature
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # 2. Final Inventory Validation and Order Creation
    settings_db = db.query(Settings).first()
    subtotal = 0.0
    order_items_data = []

    try:
        for item in body.items:
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
                
            if product.available_stock is not None:
                if product.available_stock < item.quantity:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"'{product.name}' is currently out of stock. Please review your cart before placing the order."
                    )
                product.available_stock -= item.quantity
                if product.available_stock <= 0:
                    product.stock_status = "out_of_stock"
            elif product.stock_status == "out_of_stock":
                raise HTTPException(
                    status_code=400, 
                    detail=f"'{product.name}' is currently out of stock. Please review your cart before placing the order."
                )
                
            if product.is_weight_based:
                item_subtotal = (product.price * item.quantity) / 1000.0
            else:
                item_subtotal = product.price * item.quantity
                
            subtotal += item_subtotal
            order_items_data.append({
                "product_id": product.id,
                "product_name": product.name,
                "product_price": product.price,
                "quantity": item.quantity,
                "subtotal": item_subtotal,
                "unit": product.unit,
                "is_weight_based": product.is_weight_based,
            })
            
        distance_km = None
        if settings_db and settings_db.store_latitude and settings_db.store_longitude and body.customer_latitude and body.customer_longitude:
            distance_km = calculate_haversine_distance(
                settings_db.store_latitude, 
                settings_db.store_longitude,
                body.customer_latitude, 
                body.customer_longitude
            )
            
        charges = calculate_charges(distance_km, subtotal, settings_db) if settings_db else {
            "deliverable": True,
            "distance_km": None,
            "delivery_charge": 0.0,
            "handling_charge": 0.0
        }
        
        total = subtotal + charges["delivery_charge"] + charges["handling_charge"]

        order = Order(
            order_id=generate_order_id(),
            customer_name=body.customer_name,
            phone_number=body.phone_number,
            address=body.address,
            customer_latitude=body.customer_latitude,
            customer_longitude=body.customer_longitude,
            delivery_distance_km=charges["distance_km"],
            subtotal=subtotal,
            delivery_charge=charges["delivery_charge"],
            handling_charge=charges["handling_charge"],
            total_amount=total,
            status="new",
            payment_method="online",
            payment_status="paid",
            razorpay_order_id=body.razorpay_order_id,
            razorpay_payment_id=body.razorpay_payment_id,
            razorpay_signature=body.razorpay_signature,
            tracking_token=secrets.token_urlsafe(32),
        )
        db.add(order)
        db.flush()

        for item_data in order_items_data:
            order_item = OrderItem(order_id=order.id, **item_data)
            db.add(order_item)

        db.commit()
        db.refresh(order)
        return order

    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            from app.utils.payment import process_refund
            # Detect that payment has been successfully completed but inventory validation failed.
            # Handle the payment according to the application's refund workflow.
            process_refund(body.razorpay_payment_id)
        raise e



@router.get("/", response_model=List[OrderOut])
def list_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    q = db.query(Order).options(joinedload(Order.items))
    if status:
        q = q.filter(Order.status == status)
    return q.order_by(Order.created_at.desc()).all()


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    from app.models.product import Product as P
    total_products = db.query(P).count()
    total_orders = db.query(Order).count()
    new_orders = db.query(Order).filter(Order.status == "new").count()
    confirmed = db.query(Order).filter(Order.status == "confirmed").count()
    delivered = db.query(Order).filter(Order.status == "delivered").count()
    cancelled = db.query(Order).filter(Order.status == "cancelled").count()
    return DashboardStats(
        total_products=total_products,
        total_orders=total_orders,
        new_orders=new_orders,
        confirmed_orders=confirmed,
        delivered_orders=delivered,
        cancelled_orders=cancelled,
        new_orders_count=new_orders,
    )


from app.models.product import Product

@router.get("/poll", response_model=dict)
def poll_new_orders(db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    """Simple polling endpoint for new order notifications and inventory alerts."""
    count = db.query(Order).filter(Order.status == "new").count()
    cancelled_count = db.query(Order).filter(Order.status == "cancelled").count()
    
    out_of_stock_products = []
    low_stock_products = []
    
    products = db.query(Product).filter(Product.available_stock.isnot(None)).all()
    for p in products:
        if p.available_stock <= 0 or p.stock_status == 'out_of_stock':
            out_of_stock_products.append(p.name)
        elif p.low_stock_threshold and p.available_stock <= p.low_stock_threshold:
            low_stock_products.append(p.name)
            
    return {
        "new_orders": count,
        "cancelled_orders": cancelled_count,
        "out_of_stock": out_of_stock_products,
        "low_stock": low_stock_products
    }


@router.get("/{id}", response_model=OrderOut)
def get_order(id: int, db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/track/{order_id}", response_model=OrderOut)
def track_order(order_id: str, token: str, db: Session = Depends(get_db)):
    normalized_id = order_id.strip().upper()
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.order_id == normalized_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.tracking_token != token:
        raise HTTPException(status_code=401, detail="Invalid tracking token")
    return order


@router.patch("/{id}/status", response_model=OrderOut)
def update_order_status(
    id: int,
    body: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if body.status == "cancelled" and order.status != "cancelled":
        if order.status == "delivered":
            raise HTTPException(status_code=400, detail="Delivered orders cannot be cancelled")

        if order.payment_method == "online" and order.payment_status == "paid" and order.razorpay_payment_id:
            from app.utils.payment import process_refund
            process_refund(order.razorpay_payment_id, "Order cancelled by administrator")
            order.payment_status = "refunded"

        # Restore inventory
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if product and product.available_stock is not None:
                product.available_stock += item.quantity
                if product.available_stock > 0:
                    product.stock_status = "in_stock"
                    
    if body.status == "delivered" and order.status != "delivered":
        if order.payment_method == "cod":
            order.payment_status = "paid"
                    
    order.status = body.status
    db.commit()
    db.refresh(order)
    return order

@router.post("/track/{order_id}/cancel", response_model=OrderOut)
def cancel_order_customer(order_id: str, token: str, db: Session = Depends(get_db)):
    normalized_id = order_id.strip().upper()
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.order_id == normalized_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.tracking_token != token:
        raise HTTPException(status_code=401, detail="Invalid tracking token")
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.status == "cancelled":
        raise HTTPException(status_code=400, detail="Order is already cancelled")
        
    if order.status not in ["new", "confirmed"]:
        raise HTTPException(status_code=400, detail="Order can no longer be cancelled by the customer")
        
    if order.payment_method == "online" and order.payment_status == "paid" and order.razorpay_payment_id:
        from app.utils.payment import process_refund
        process_refund(order.razorpay_payment_id, "Order cancelled by customer")
        order.payment_status = "refunded"

    # Restore inventory
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if product and product.available_stock is not None:
            product.available_stock += item.quantity
            if product.available_stock > 0:
                product.stock_status = "in_stock"
                
    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return order

class RecoverOrderRequest(BaseModel):
    order_id: str
    phone_number: str

@router.post("/track/recover")
def recover_order(body: RecoverOrderRequest, db: Session = Depends(get_db)):
    normalized_order_id = body.order_id.strip().upper()
    normalized_phone = body.phone_number.strip()
    
    order = db.query(Order).filter(Order.order_id == normalized_order_id).first()
    if not order or order.phone_number != normalized_phone:
        # Generic error message to prevent enumeration
        raise HTTPException(status_code=400, detail="Invalid order ID or phone number")
        
    order.tracking_token = secrets.token_urlsafe(32)
    db.commit()
    db.refresh(order)
    return {"tracking_token": order.tracking_token, "order_id": order.order_id}
