from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx
import re
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.settings import Settings
from app.schemas import SettingsOut, SettingsUpdate, ExtractLocationRequest, ExtractLocationResponse

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/", response_model=SettingsOut)
def update_settings(
    body: SettingsUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin),
):
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings()
        db.add(settings)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/extract-location", response_model=ExtractLocationResponse)
def extract_location(
    body: ExtractLocationRequest,
    _: str = Depends(get_current_admin)
):
    try:
        with httpx.Client(follow_redirects=True, timeout=10.0) as client:
            response = client.get(body.url)
            final_url = str(response.url)
            
            # Match @lat,lng
            match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', final_url)
            if match:
                return ExtractLocationResponse(
                    latitude=float(match.group(1)),
                    longitude=float(match.group(2))
                )
            raise HTTPException(status_code=400, detail="Could not extract coordinates from the provided link.")
    except httpx.RequestError:
        raise HTTPException(status_code=400, detail="Failed to reach the provided Google Maps link.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
