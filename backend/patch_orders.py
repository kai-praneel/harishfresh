import re

file_path = "/home/kai/Downloads/harishfresh_project/harishfresh/backend/app/routes/orders.py"
with open(file_path, "r") as f:
    content = f.read()

# Replace update_order_status
old_update_status = """    if body.status == "cancelled" and order.status != "cancelled":
        # Restore inventory
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if product and product.available_stock is not None:
                product.available_stock += item.quantity
                if product.available_stock > 0:
                    product.stock_status = "in_stock"
                    
    order.status = body.status
    db.commit()
    db.refresh(order)
    return order"""

new_update_status = """    if body.status == "cancelled" and order.status != "cancelled":
        if order.status == "delivered":
            raise HTTPException(status_code=400, detail="Delivered orders cannot be cancelled")

        if order.payment_method == "online" and order.payment_status == "paid" and order.razorpay_payment_id:
            from app.utils.payment import process_refund
            process_refund(order.razorpay_payment_id, "Order cancelled by administrator")
            order.payment_status = "refunded"

        # Restore inventory
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if product and product.available_stock is not None:
                product.available_stock += item.quantity
                if product.available_stock > 0:
                    product.stock_status = "in_stock"
                    
    if body.status == "delivered" and order.status != "delivered":
        if order.payment_method == "cod":
            order.payment_status = "paid"
                    
    order.status = body.status
    db.commit()
    db.refresh(order)
    return order"""

content = content.replace(old_update_status, new_update_status)

# Append customer cancel endpoint
customer_cancel_endpoint = """
@router.post("/track/{order_id}/cancel", response_model=OrderOut)
def cancel_order_customer(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.status == "cancelled":
        raise HTTPException(status_code=400, detail="Order is already cancelled")
        
    if order.status not in ["new", "confirmed"]:
        raise HTTPException(status_code=400, detail="Order can no longer be cancelled by the customer")
        
    if order.payment_method == "online" and order.payment_status == "paid" and order.razorpay_payment_id:
        from app.utils.payment import process_refund
        process_refund(order.razorpay_payment_id, "Order cancelled by customer")
        order.payment_status = "refunded"

    # Restore inventory
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if product and product.available_stock is not None:
            product.available_stock += item.quantity
            if product.available_stock > 0:
                product.stock_status = "in_stock"
                
    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return order
"""

if "cancel_order_customer" not in content:
    content += customer_cancel_endpoint

with open(file_path, "w") as f:
    f.write(content)

print("orders.py updated successfully!")
