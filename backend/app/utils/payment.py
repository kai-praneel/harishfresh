import razorpay
from app.core.config import settings

def process_refund(razorpay_payment_id: str, reason: str = "Inventory validation failed"):
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return False
        
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    try:
        payment = client.payment.fetch(razorpay_payment_id)
        if payment['status'] in ['captured', 'authorized']:
            refund = client.payment.refund(razorpay_payment_id, {
                "amount": payment['amount'],
                "notes": {
                    "reason": reason
                }
            })
            return refund['status']
        return payment['status']
    except Exception as e:
        print(f"Failed to issue refund for {razorpay_payment_id}: {e}")
        return "failed"
