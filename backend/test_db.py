import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.order import Order
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

orders = db.query(Order).order_by(Order.id.desc()).limit(5).all()
for o in orders:
    print(f"ID: {o.order_id}, Phone: '{o.phone_number}', Token: {o.tracking_token}")

print("\nTesting Query with exactly matched case:")
if orders:
    test_o = db.query(Order).filter(Order.order_id == orders[0].order_id).first()
    print(f"Match exact case: {test_o is not None}")
    
    test_o2 = db.query(Order).filter(Order.order_id == orders[0].order_id.lower()).first()
    print(f"Match lower case: {test_o2 is not None}")

