import re
import os

file_path = "/home/kai/Downloads/harishfresh_project/harishfresh/backend/app/routes/orders.py"
with open(file_path, "r") as f:
    content = f.read()

# Add import secrets
if "import secrets" not in content:
    content = "import secrets\n" + content

# Add tracking_token to place_order
content = re.sub(
    r'(status="new",\n\s+payment_method="cod",\n\s+payment_status="pending",)',
    r'\1\n            tracking_token=secrets.token_urlsafe(32),',
    content
)

# Add tracking_token to verify_and_place
content = re.sub(
    r'(status="new",\n\s+payment_method="online",\n\s+payment_status="paid",\n\s+razorpay_order_id=body\.razorpay_order_id,\n\s+razorpay_payment_id=body\.razorpay_payment_id,\n\s+razorpay_signature=body\.razorpay_signature,)',
    r'\1\n            tracking_token=secrets.token_urlsafe(32),',
    content
)

# Update track_order to check token
old_track = """@router.get("/track/{order_id}", response_model=OrderOut)
def track_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order"""

new_track = """@router.get("/track/{order_id}", response_model=OrderOut)
def track_order(order_id: str, token: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.tracking_token != token:
        raise HTTPException(status_code=401, detail="Invalid tracking token")
    return order"""

if old_track in content:
    content = content.replace(old_track, new_track)


# Update cancel_order_customer to check token
old_cancel = """@router.post("/track/{order_id}/cancel", response_model=OrderOut)
def cancel_order_customer(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.order_id == order_id).first()"""

new_cancel = """@router.post("/track/{order_id}/cancel", response_model=OrderOut)
def cancel_order_customer(order_id: str, token: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.tracking_token != token:
        raise HTTPException(status_code=401, detail="Invalid tracking token")"""

if old_cancel in content:
    content = content.replace(old_cancel, new_cancel)

# Add recover_order
class_recover = """
class RecoverOrderRequest(BaseModel):
    order_id: str
    phone_number: str

@router.post("/track/recover")
def recover_order(body: RecoverOrderRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == body.order_id).first()
    if not order or order.phone_number != body.phone_number:
        # Generic error message to prevent enumeration
        raise HTTPException(status_code=400, detail="Invalid order ID or phone number")
        
    order.tracking_token = secrets.token_urlsafe(32)
    db.commit()
    db.refresh(order)
    return {"tracking_token": order.tracking_token}
"""

if "RecoverOrderRequest" not in content:
    content += class_recover

with open(file_path, "w") as f:
    f.write(content)

print("orders.py updated successfully!")
