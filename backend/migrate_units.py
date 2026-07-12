import asyncio
import sys
import os

# Add the backend directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from sqlalchemy import text

def run_migration():
    db = SessionLocal()
    try:
        print("Starting migration...")
        
        # 1. Add column if it doesn't exist
        print("Adding unit column to order_items...")
        db.execute(text("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit VARCHAR;"))
        
        # 2. Backfill existing records
        print("Backfilling existing records...")
        result = db.execute(text("""
            UPDATE order_items oi
            SET unit = COALESCE(p.unit, 'Piece')
            FROM products p
            WHERE oi.product_id = p.id
            AND oi.unit IS NULL;
        """))
        
        # We also need to set any remaining NULL units (e.g. products that got deleted) to a default
        result2 = db.execute(text("""
            UPDATE order_items
            SET unit = 'Kg'
            WHERE unit IS NULL;
        """))
        
        db.commit()
        print(f"Migration completed successfully. Backfilled {result.rowcount + result2.rowcount} rows.")
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
