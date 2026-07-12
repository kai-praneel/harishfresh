from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.settings import Settings
from app.schemas import DeliveryValidationRequest, DeliveryValidationResponse
from app.utils.location import calculate_haversine_distance, calculate_charges

router = APIRouter(prefix="/delivery", tags=["delivery"])

@router.post("/validate", response_model=DeliveryValidationResponse)
def validate_delivery(body: DeliveryValidationRequest, db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=500, detail="Store settings not configured")

    distance_km = None
    if settings.store_latitude and settings.store_longitude:
        distance_km = calculate_haversine_distance(
            settings.store_latitude, 
            settings.store_longitude,
            body.customer_latitude, 
            body.customer_longitude
        )

    result = calculate_charges(distance_km, body.subtotal, settings)
    return result
