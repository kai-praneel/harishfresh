import re

file_path = "/home/kai/Downloads/harishfresh_project/harishfresh/frontend/app/checkout/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add paymentMethod state
if "const [paymentMethod," not in content:
    content = content.replace(
        "const [loading, setLoading] = useState(false);",
        "const [loading, setLoading] = useState(false);\n  const [paymentMethod, setPaymentMethod] = useState<\"cod\" | \"online\">(\"cod\");"
    )

# Update handleSubmit
new_handleSubmit_start = """const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const minOrder = settings?.minimum_order_amount || 200;
    if (total < minOrder) {
      toast.error(`Minimum order amount is ${formatCurrency(minOrder)}`);
      return;
    }
    setLoading(true);
    try {
      const fullAddress = `${form.house_no}, ${form.street}${form.landmark ? `, ${form.landmark}` : ""}, ${form.city} - ${form.pincode}`;
      const payload = {
        ...form,
        address: fullAddress,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      };

      if (paymentMethod === "cod") {
        const verifyRes = await ordersApi.place(payload);
        setOrder(verifyRes.data);
        clearCart();
        toast.success("Order placed successfully!");
        setLoading(false);
        return;
      }

      // 1. Initiate Payment
      const initRes = await ordersApi.initiatePayment(payload);"""

pattern_handle_submit_start = r"const handleSubmit = async \(e: React\.FormEvent\) => \{.*?// 1\. Initiate Payment\n      const initRes = await ordersApi\.initiatePayment\(payload\);"
content = re.sub(pattern_handle_submit_start, new_handleSubmit_start, content, flags=re.DOTALL)


# Update JSX
jsx_payment = """
            <div className="mt-8 border-t border-gray-100 pt-8">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Payment Method</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`relative flex items-center p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${paymentMethod === 'cod' ? 'border-green-500 bg-green-50/50 ring-2 ring-green-100' : 'border-gray-200 hover:border-green-200 bg-white'}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500" />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-gray-900">Cash on Delivery</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Pay when you receive the order</span>
                  </div>
                </label>
                <label className={`relative flex items-center p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${paymentMethod === 'online' ? 'border-green-500 bg-green-50/50 ring-2 ring-green-100' : 'border-gray-200 hover:border-green-200 bg-white'}`}>
                  <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500" />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-gray-900">Online Payment</span>
                    <span className="block text-xs text-gray-500 mt-0.5">UPI, Cards, Wallets</span>
                  </div>
                </label>
              </div>
            </div>

            {!canCheckout && ("""

pattern_jsx = r"            \{\!canCheckout && \("
content = content.replace("            {!canCheckout && (", jsx_payment)

with open(file_path, "w") as f:
    f.write(content)

print("Updated checkout page successfully!")
