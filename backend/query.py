import sys
from app.core.database import SessionLocal
from app.models.order import Order

db = SessionLocal()
order = db.query(Order).first()
if order:
    print(f"{order.order_id},{order.phone_number},{order.tracking_token}")
else:
    print("No orders")
