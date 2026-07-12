import httpx
import re

url = "https://maps.app.goo.gl/Yy6Jc3RFTK3w3QkE7" # Just an example if it exists, or maybe I should find a real one.
# Let's use a standard search link
url = "https://goo.gl/maps/xyz"

def parse_gmaps(url):
    try:
        r = httpx.get(url, follow_redirects=True)
        final_url = str(r.url)
        print("Final URL:", final_url)
        # Match @lat,lng
        match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', final_url)
        if match:
            return float(match.group(1)), float(match.group(2))
    except Exception as e:
        print(e)

print(parse_gmaps(url))
