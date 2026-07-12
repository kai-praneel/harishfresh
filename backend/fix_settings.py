from app.core.database import SessionLocal
from app.models.settings import Settings

db = SessionLocal()
settings = db.query(Settings).first()
if settings:
    settings.store_latitude = 17.440081
    settings.store_longitude = 78.348916
    db.commit()
    print("Settings coordinates fixed")
db.close()
