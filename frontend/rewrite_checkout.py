import re

file_path = "/home/kai/Downloads/harishfresh_project/harishfresh/frontend/app/checkout/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add next/script import
if "import Script from" not in content:
    content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport Script from "next/script";')

# Replace handleSubmit
pattern = r"const handleSubmit = async \(e: React\.FormEvent\) => \{.*?setLoading\(false\);\n    \}\n  \};"

new_handleSubmit = """const handleSubmit = async (e: React.FormEvent) => {
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

      // 1. Initiate Payment
      const initRes = await ordersApi.initiatePayment(payload);
      const { razorpay_order_id, amount, currency } = initRes.data;

      // 2. Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(amount * 100), // convert to paise
        currency: currency || "INR",
        name: "Harish Fresh",
        description: "Order Payment",
        order_id: razorpay_order_id,
        handler: async function (response: any) {
          try {
            setLoading(true);
            const verifyRes = await ordersApi.verifyAndPlaceOrder({
              ...payload,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setOrder(verifyRes.data);
            clearCart();
            toast.success("Order placed successfully!");
          } catch (verifyErr: any) {
            const detail = verifyErr?.response?.data?.detail || "";
            if (detail.toLowerCase().includes("out of stock") || detail.toLowerCase().includes("available")) {
              toast.error("Some items in your cart are no longer available. Your payment has been refunded.");
            } else {
              toast.error(detail || "Payment verification failed. Please contact support.");
            }
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: form.customer_name,
          contact: form.phone_number,
        },
        theme: {
          color: "#22c55e",
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.error("Payment cancelled.");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();

    } catch (err: any) {
      setLoading(false);
      const detail = err?.response?.data?.detail || "";
      if (detail.toLowerCase().includes("out of stock") || detail.toLowerCase().includes("available")) {
        toast.error("Some items in your cart are no longer available. Please review your cart before placing the order.");
      } else {
        toast.error(detail || "Failed to initiate order. Please try again.");
      }
    }
  };"""

content = re.sub(pattern, new_handleSubmit, content, flags=re.DOTALL)

# Add Script to CustomerLayout return block
# We'll just look for `<CustomerLayout>` and replace it with `<CustomerLayout><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />`
# But only in the main return, not the loaders.
main_return_pattern = r"(return \(\n\s*)<CustomerLayout>"
content = re.sub(main_return_pattern, r'\1<CustomerLayout>\n      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />', content, count=1)

with open(file_path, "w") as f:
    f.write(content)

print("Replaced checkout successfully!")
