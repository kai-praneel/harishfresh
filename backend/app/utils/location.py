import math
from typing import Tuple, Dict, Any

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers.
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

def calculate_charges(distance_km: float, subtotal: float, settings: Any) -> Dict[str, Any]:
    """
    Calculate delivery validation, distances, and charges based on settings.
    Returns dict: deliverable, distance_km, delivery_charge, handling_charge, message
    """
    if distance_km is None or settings.store_latitude is None or settings.store_longitude is None:
        return {
            "deliverable": True, # If store location isn't set, everything is deliverable
            "distance_km": None,
            "delivery_charge": 0.0,
            "handling_charge": settings.handling_charge or 0.0,
            "message": None
        }

    max_radius = settings.max_delivery_radius_km or 15.0
    if distance_km > max_radius:
        return {
            "deliverable": False,
            "distance_km": distance_km,
            "delivery_charge": 0.0,
            "handling_charge": 0.0,
            "message": f"Sorry, we only deliver within {max_radius}km of our store."
        }
        
    delivery_charge = 0.0
    free_radius = settings.free_delivery_radius_km or 5.0
    
    if settings.delivery_charges_enabled and distance_km > free_radius:
        if settings.delivery_charge_model == "flat":
            delivery_charge = settings.flat_delivery_fee or 0.0
        elif settings.delivery_charge_model == "per_km":
            billable_distance = math.ceil(distance_km - free_radius)
            delivery_charge = billable_distance * (settings.delivery_charge_per_km or 10.0)

    # Note: Module 2 adds free_delivery_above_amount logic. 
    # For Module 1, we just calculate raw distance-based charges.
    
    return {
        "deliverable": True,
        "distance_km": distance_km,
        "delivery_charge": round(delivery_charge, 2),
        "handling_charge": settings.handling_charge or 0.0,
        "message": None
    }
