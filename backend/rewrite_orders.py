import os
import re

file_path = "/home/kai/Downloads/harishfresh_project/harishfresh/backend/app/routes/orders.py"
with open(file_path, "r") as f:
    content = f.read()

# I will replace the place_order function.
# Let's write the new endpoints

new_endpoints = """
import razorpay
from app.schemas import OrderInitiateResponse, OrderVerifyAndPlace

@router.post("/initiate-payment", response_model=OrderInitiateResponse)
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
            status="confirmed",
            payment_method="online",
            payment_status="paid",
            razorpay_order_id=body.razorpay_order_id,
            razorpay_payment_id=body.razorpay_payment_id,
            razorpay_signature=body.razorpay_signature,
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
        # If the exception is an HTTPException (e.g. inventory error), we should process refund
        if isinstance(e, HTTPException):
            try:
                # Issue refund via Razorpay since inventory failed AFTER payment
                # We fetch the payment to get the actual amount paid, or refund full.
                # Here we just refund full amount
                client.payment.refund(body.razorpay_payment_id, {
                    "notes": {
                        "reason": "Inventory validation failed after payment"
                    }
                })
            except Exception as refund_err:
                # Log refund error (ideally to a logging system)
                print(f"Failed to issue refund for {body.razorpay_payment_id}: {refund_err}")
        raise e
"""

pattern = r"@router\.post\(\"/\", response_model=OrderOut\)\ndef place_order.*?return order"
new_content = re.sub(pattern, new_endpoints, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(new_content)

print("Replaced successfully!")
