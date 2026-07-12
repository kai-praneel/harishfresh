import math

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371
    return c * r

print("Gachibowli to nearby:")
print(calculate_haversine_distance(17.440081, 78.348916, 17.440081, 78.349916))

# Let's try 5km away
# 1 degree lat is ~111km, so 5km is ~0.045
print("5km away:")
print(calculate_haversine_distance(17.440081, 78.348916, 17.485081, 78.348916))
