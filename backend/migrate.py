import psycopg2
from psycopg2 import sql

def migrate():
    conn = psycopg2.connect("postgresql+psycopg2://postgres:nani1410@localhost:5432/harishfresh")
    conn.autocommit = True
    with conn.cursor() as cur:
        try:
            cur.execute("ALTER TABLE order_items ADD COLUMN unit VARCHAR DEFAULT 'Kg' NOT NULL;")
            print("Migration successful: unit column added.")
        except Exception as e:
            print(f"Migration failed or already applied: {e}")
            
if __name__ == "__main__":
    migrate()
