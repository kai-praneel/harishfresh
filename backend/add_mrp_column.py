import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.core.database import engine
from sqlalchemy import text

def add_mrp_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE products ADD COLUMN mrp DOUBLE PRECISION;"))
            conn.commit()
            print("Successfully added mrp column.")
        except Exception as e:
            if "already exists" in str(e):
                print("Column already exists.")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    add_mrp_column()
