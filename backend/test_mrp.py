import sys
import os
import urllib.request

sys.path.append(os.path.dirname(__file__))
from app.core.database import SessionLocal
from app.models.product import Product

def test():
    db = SessionLocal()
    p = db.query(Product).filter(Product.id == 1).first()
    if p:
        p.mrp = 55.5
        db.commit()
        print("Set DB product 1 mrp to 55.5")
    
    # Read from API
    req = urllib.request.Request("http://localhost:8000/api/products/1")
    with urllib.request.urlopen(req) as res:
        print("API GET Product 1:", res.read().decode())

if __name__ == "__main__":
    test()
