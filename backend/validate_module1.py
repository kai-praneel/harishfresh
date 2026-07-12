import httpx
import json

base_url = "http://localhost:8000/api"

def update_settings(delivery_charges_enabled=True, delivery_charge_model="flat", flat_delivery_fee=50.0, delivery_charge_per_km=10.0, handling_charge=0.0, max_delivery_radius_km=10.0, free_delivery_radius_km=3.0, store_latitude=17.440081, store_longitude=78.348916):
    # Fetch current settings to get any required fields
    r = httpx.get(f"{base_url}/settings/")
    current = r.json()
    
    # Update
    current["delivery_charges_enabled"] = delivery_charges_enabled
    current["delivery_charge_model"] = delivery_charge_model
    current["flat_delivery_fee"] = flat_delivery_fee
    current["delivery_charge_per_km"] = delivery_charge_per_km
    current["handling_charge"] = handling_charge
    current["max_delivery_radius_km"] = max_delivery_radius_km
    current["free_delivery_radius_km"] = free_delivery_radius_km
    current["store_latitude"] = store_latitude
    current["store_longitude"] = store_longitude
    
    # Assuming we need to authenticate for settings?
    # Usually the endpoints are protected. Let's check.
    r = httpx.put(f"{base_url}/settings/", json=current)
    if r.status_code in [401, 403]:
        # login first
        login_data = {"username": "example_user", "password": "nani1410"} # Trying config from env
        r_login = httpx.post(f"{base_url}/auth/login", json=login_data)
        if r_login.status_code == 200:
            token = r_login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            r = httpx.put(f"{base_url}/settings/", json=current, headers=headers)
        else:
            print("Failed to login to update settings", r_login.text)
            return False
            
    print(f"Updated Settings: model={delivery_charge_model}, enabled={delivery_charges_enabled}")
    return r.status_code == 200

def check_delivery(lat, lng, subtotal=500):
    r = httpx.post(f"{base_url}/delivery/validate", json={
        "customer_latitude": lat,
        "customer_longitude": lng,
        "subtotal": subtotal
    })
    return r.json()

def run_validations():
    print("--- VALIDATION RESULTS ---")
    
    # Scenario 1: Inside free radius
    print("\nScenario: Inside Free Radius (2km from store)")
    update_settings(delivery_charge_model="flat", flat_delivery_fee=50, max_delivery_radius_km=10, free_delivery_radius_km=5)
    # Store is 17.440081, 78.348916
    # A point ~2km away: 17.458000, 78.348916 (approx 1 degree lat = 111km, so 0.018 is ~2km)
    res = check_delivery(17.458000, 78.348916)
    print(json.dumps(res, indent=2))
    
    # Scenario 2: Inside service radius, flat fee
    print("\nScenario: Inside Service Radius (8km from store), Flat Fee")
    update_settings(delivery_charge_model="flat", flat_delivery_fee=50, max_delivery_radius_km=10, free_delivery_radius_km=5)
    # A point ~8km away: 17.512000, 78.348916 (approx 0.072 lat is 8km)
    res = check_delivery(17.512000, 78.348916)
    print(json.dumps(res, indent=2))
    
    # Scenario 3: Inside service radius, per-km fee
    print("\nScenario: Inside Service Radius (8km from store), Per-KM Fee ($10/km)")
    update_settings(delivery_charge_model="per_km", delivery_charge_per_km=10, max_delivery_radius_km=10, free_delivery_radius_km=5)
    res = check_delivery(17.512000, 78.348916)
    print(json.dumps(res, indent=2))
    
    # Scenario 4: Outside service radius
    print("\nScenario: Outside Service Radius (15km from store)")
    update_settings(delivery_charge_model="per_km", delivery_charge_per_km=10, max_delivery_radius_km=10, free_delivery_radius_km=5)
    res = check_delivery(17.575000, 78.348916) # approx 15km
    print(json.dumps(res, indent=2))
    
    # Scenario 5: Delivery disabled
    print("\nScenario: Delivery Charges Disabled")
    update_settings(delivery_charges_enabled=False, delivery_charge_model="flat", flat_delivery_fee=50, max_delivery_radius_km=10, free_delivery_radius_km=5)
    res = check_delivery(17.512000, 78.348916)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    run_validations()
