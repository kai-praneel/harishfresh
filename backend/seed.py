"""
Seed script: Creates initial admin user, default settings, and sample categories.
Run: python seed.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.core.config import settings
from app.models import Admin, Category, Subcategory, Settings

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Admin
    existing_admin = db.query(Admin).filter(Admin.username == settings.ADMIN_USERNAME).first()
    if not existing_admin:
        admin = Admin(
            username=settings.ADMIN_USERNAME,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
        )
        db.add(admin)
        print(f"✅ Admin created: {settings.ADMIN_USERNAME}")
    else:
        print("ℹ️  Admin already exists")

    # Default settings
    existing_settings = db.query(Settings).first()
    if not existing_settings:
        s = Settings(
            whatsapp_number="917396896009",
            minimum_order_amount=200.0,
            free_delivery_message="Free delivery within 5km",
            bulk_order_message="Hi, I want to place a bulk order.",
            store_name="HarishFresh",
            store_address="Your Store Address Here",
        )
        db.add(s)
        print("✅ Default settings created")
    else:
        print("ℹ️  Settings already exist")

    # Seed categories
    categories_data = [
        {"name": "Vegetables", "slug": "vegetables", "description": "Fresh farm vegetables", "subcategories": [
            {"name": "Leafy Vegetables", "slug": "leafy-vegetables"},
            {"name": "Root Vegetables", "slug": "root-vegetables"},
            {"name": "Organic Vegetables", "slug": "organic-vegetables"},
        ]},
        {"name": "Fruits", "slug": "fruits", "description": "Fresh seasonal fruits", "subcategories": [
            {"name": "Seasonal Fruits", "slug": "seasonal-fruits"},
            {"name": "Imported Fruits", "slug": "imported-fruits"},
        ]},
        {"name": "Dry Fruits", "slug": "dry-fruits", "description": "Premium quality dry fruits", "subcategories": [
            {"name": "Premium Dry Fruits", "slug": "premium-dry-fruits"},
        ]},
        {"name": "Millets", "slug": "millets", "description": "Nutritious organic millets", "subcategories": [
            {"name": "Organic Millets", "slug": "organic-millets"},
        ]},
    ]

    for cat_data in categories_data:
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not existing:
            subcats = cat_data.pop("subcategories")
            cat = Category(**cat_data)
            db.add(cat)
            db.flush()
            for sub_data in subcats:
                sub = Subcategory(category_id=cat.id, **sub_data)
                db.add(sub)
            print(f"✅ Category created: {cat_data['name']}")
        else:
            print(f"ℹ️  Category exists: {cat_data['name']}")

    db.commit()
    print("\n🎉 Seed complete!")

except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
