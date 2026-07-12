import requests

url = "http://localhost:8000/api/orders/track/recover"
payload = {
    "order_id": "hf87117239",
    "phone_number": "7989226181"
}

response = requests.post(url, json=payload)
print("Status Code:", response.status_code)
print("Response JSON:", response.json())
