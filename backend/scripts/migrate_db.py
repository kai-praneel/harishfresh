import os
import sys
from sqlalchemy import create_engine, text

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def run_migration():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if image_file_id exists in products table
            # This is a basic approach suitable for SQLite/PostgreSQL for a simple column add
            print("Checking if 'image_file_id' column exists in 'products' table...")
            
            # Simple safe check by querying 1 row
            try:
                conn.execute(text("SELECT image_file_id FROM products LIMIT 1"))
                print("'image_file_id' already exists in 'products'.")
            except Exception as e:
                # Column doesn't exist, rollback the aborted transaction first
                conn.rollback()
                print("Column 'image_file_id' not found in 'products'. Adding it...")
                conn.execute(text("ALTER TABLE products ADD COLUMN image_file_id VARCHAR"))
                conn.commit()
                print("Successfully added 'image_file_id' to 'products'.")
                
        except Exception as e:
            print(f"Migration error: {str(e)}")
            
    print("Migration finished.")

if __name__ == "__main__":
    run_migration()
