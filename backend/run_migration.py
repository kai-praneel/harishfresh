import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.core.database import engine

def main():
    sql = text("ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR DEFAULT 'Kg' NOT NULL;")
    print(f"Running migration: {sql}")
    try:
        with engine.begin() as conn:
            conn.execute(sql)
        print("✅ Migration finished successfully!")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
