import re

file_path = "/home/kai/Downloads/harishfresh_project/harishfresh/backend/app/routes/orders.py"
with open(file_path, "r") as f:
    content = f.read()

cod_endpoint = """
@router.post("/", response_model=OrderOut)
def place_order(body: OrderCreate, db: Session = Depends(get_db)):
    settings_db = db.query(Settings).first()
    min_amount = settings_db.minimum_order_amount if settings_db else 200.0

    if not body.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    subtotal = 0.0
    order_items_data = []

    for item in body.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            
        if product.available_stock is not None:
            if product.available_stock < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"'{product.name}' is currently out of stock. Please review your cart before placing the order."
                )
            product.available_stock -= item.quantity
            if product.available_stock <= 0:
                product.stock_status = "out_of_stock"
        elif product.stock_status == "out_of_stock":
            raise HTTPException(
                status_code=400, 
                detail=f"'{product.name}' is currently out of stock. Please review your cart before placing the order."
            )
            
        if product.is_weight_based:
            item_subtotal = (product.price * item.quantity) / 1000.0
        else:
            item_subtotal = product.price * item.quantity
            
        subtotal += item_subtotal
        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_price": product.price,
            "quantity": item.quantity,
            "subtotal": item_subtotal,
            "unit": product.unit,
            "is_weight_based": product.is_weight_based,
        })

    if subtotal < min_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order amount is ₹{min_amount:.0f}",
        )
        
    distance_km = None
    if settings_db and settings_db.store_latitude and settings_db.store_longitude and body.customer_latitude and body.customer_longitude:
        distance_km = calculate_haversine_distance(
            settings_db.store_latitude, 
            settings_db.store_longitude,
            body.customer_latitude, 
            body.customer_longitude
        )
        
    charges = calculate_charges(distance_km, subtotal, settings_db) if settings_db else {
        "deliverable": True,
        "distance_km": None,
        "delivery_charge": 0.0,
        "handling_charge": 0.0
    }
    
    if not charges["deliverable"]:
        raise HTTPException(status_code=400, detail=charges["message"] or "Delivery not available to this location.")
        
    total = subtotal + charges["delivery_charge"] + charges["handling_charge"]

    order = Order(
        order_id=generate_order_id(),
        customer_name=body.customer_name,
        phone_number=body.phone_number,
        address=body.address,
        customer_latitude=body.customer_latitude,
        customer_longitude=body.customer_longitude,
        delivery_distance_km=charges["distance_km"],
        subtotal=subtotal,
        delivery_charge=charges["delivery_charge"],
        handling_charge=charges["handling_charge"],
        total_amount=total,
        status="new",
        payment_method="cod",
        payment_status="pending",
    )
    db.add(order)
    db.flush()

    for item_data in order_items_data:
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)

    db.commit()
    db.refresh(order)
    return order

@router.post("/initiate-payment"
"""

if "@router.post(\"/\", response_model=OrderOut)" not in content:
    content = content.replace("@router.post(\"/initiate-payment\"", cod_endpoint)

    with open(file_path, "w") as f:
        f.write(content)
    print("Added place_order endpoint.")
else:
    print("Already exists.")

