"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import Image from "next/image";
import { ShoppingBag, ArrowLeft, CheckCircle, MessageCircle, Printer, Download, MapPin, Package } from "lucide-react";
import CustomerLayout from "@/components/customer/CustomerLayout";
import Invoice from "@/components/shared/Invoice";
import { downloadInvoicePdf } from "@/utils/pdf";
import { useCartStore } from "@/store/cartStore";
import { ordersApi, settingsApi, getImageUrl, deliveryApi } from "@/services/api";
import { formatCurrency, formatWeight } from "@/utils";
import { Order, Settings } from "@/types";
import toast from "react-hot-toast";
import MapPicker from "@/components/shared/MapPicker";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({ 
    customer_name: "", 
    phone_number: "", 
    house_no: "",
    street: "",
    landmark: "",
    city: "Hyderabad",
    pincode: "",
    delivery_notes: "",
    customer_latitude: null as number | null, 
    customer_longitude: null as number | null 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [validatingDelivery, setValidatingDelivery] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{ deliverable: boolean; distance_km: number | null; delivery_charge: number; handling_charge: number; message: string | null } | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [mounted, setMounted] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subtotal = totalAmount();
  const total = subtotal + (deliveryInfo?.delivery_charge || 0) + (deliveryInfo?.handling_charge || (settings?.handling_charge || 0));

  useEffect(() => {
    setMounted(true);
    settingsApi.get().then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (mounted && items.length === 0 && !order) router.replace("/cart");
  }, [mounted, items, order, router]);

  if (!mounted) {
    return (
      <CustomerLayout>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-8 bg-gray-100 rounded w-1/4 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customer_name.trim() || form.customer_name.trim().length < 2)
      e.customer_name = "Enter your full name";
    if (!form.phone_number.trim() || !/^[6-9]\d{9}$/.test(form.phone_number.trim()))
      e.phone_number = "Enter a valid 10-digit mobile number";
    if (!form.house_no.trim() || !form.street.trim() || !form.city.trim() || !form.pincode.trim())
      e.address = "Please fill in all mandatory address fields";
    if (!form.customer_latitude || !form.customer_longitude)
      e.location = "Please select your delivery location on the map";
    if (deliveryInfo && !deliveryInfo.deliverable)
      e.delivery = deliveryInfo.message || "Delivery is not available to this location";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const checkDelivery = async (lat: number, lng: number) => {
    if (!settings?.delivery_charges_enabled && !settings?.max_delivery_radius_km && !settings?.handling_charge) return;
    
    setValidatingDelivery(true);
    try {
      const res = await deliveryApi.validate({
        customer_latitude: lat,
        customer_longitude: lng,
        subtotal: subtotal
      });
      setDeliveryInfo(res.data);
    } catch (err: any) {
      toast.error("Failed to calculate delivery charges");
    } finally {
      setValidatingDelivery(false);
    }
  };

  const handleLocationChange = (pos: { lat: number; lng: number }) => {
    setForm((f) => ({ ...f, customer_latitude: pos.lat, customer_longitude: pos.lng }));
    if (errors.location) setErrors((e) => ({ ...e, location: "" }));

    if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
    
    locationTimeoutRef.current = setTimeout(async () => {
      checkDelivery(pos.lat, pos.lng);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`);
        const data = await res.json();
        if (data && data.address) {
          setForm(f => ({
            ...f,
            house_no: data.address.house_number || "",
            street: data.address.road || data.address.suburb || "",
            city: data.address.city || data.address.town || data.address.state_district || "Hyderabad",
            pincode: data.address.postcode || "",
          }));
          if (errors.address) setErrors(e => ({ ...e, address: "" }));
        }
      } catch (e) {
        console.error("Reverse geocoding failed", e);
      }
    }, 800);
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setLocatingUser(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          handleLocationChange({ lat, lng });
          setLocatingUser(false);
        },
        (error) => {
          toast.error("Could not get your location. Please check browser permissions.");
          setLocatingUser(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  // ── Order Confirmation ────────────────────────────────────────────────────
  if (order) {
    const trackingOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const trackingUrl = order.tracking_token 
      ? `${trackingOrigin}/track/${order.order_id}?token=${order.tracking_token}`
      : `${trackingOrigin}/track`;

    const message = `*New Order:* #${order.order_id}
*Customer:* ${order.customer_name}
*Phone:* ${order.phone_number}
*Address:* ${order.address}

*Track Order:*
${trackingUrl}

*Items:*
${order.items.map((item, index) => {
  const qtyStr = item.is_weight_based ? formatWeight(item.quantity) : `${item.quantity} x ${item.unit || "Kg"}`;
  return `${index + 1}. ${item.product_name} - ${qtyStr} - ${formatCurrency(item.subtotal)}`;
}).join("\n")}

*Total Amount:* ${formatCurrency(order.total_amount)}`;

    const waUrl = `https://wa.me/${settings?.whatsapp_number || "917396896009"}?text=${encodeURIComponent(message)}`;
    return (
      <CustomerLayout>
        <div className="max-w-xl mx-auto px-4 py-16 pb-32 lg:pb-16 text-center">
          <div className="bg-white rounded-[2.5rem] border border-green-50 shadow-[0_8px_30px_rgba(34,197,94,0.08)] p-8 sm:p-10 relative overflow-hidden">
            {/* Decorative background circle */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="relative w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-[6px] border-white shadow-[0_0_0_1px_rgba(22,163,74,0.1)]">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-3 tracking-tight">Order Placed!</h1>
            <p className="text-gray-500 mb-8 font-medium">Thank you, {order.customer_name}. Your order has been received.</p>

            <div className="bg-[#f8fafc] rounded-[1.5rem] p-6 mb-8 text-left border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500 font-medium">Order ID</span>
                <span className="font-black text-gray-900 text-lg">#{order.order_id}</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">{item.product_name} <span className="text-gray-400">({item.is_weight_based ? formatWeight(item.quantity) : `${item.unit || "Kg"} × ${item.quantity}`})</span></span>
                    <span className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-200 mt-4 pt-4 flex justify-between font-black text-xl">
                <span className="text-gray-900">Total</span>
                <span className="text-green-600">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href={order.tracking_token ? `/track/${order.order_id}?token=${order.tracking_token}` : `/track`}
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold h-14 rounded-full transition-all duration-200 shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5"
              >
                <Package className="w-5 h-5" />
                Track Order Online
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-14 rounded-full transition-all duration-200 shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" />
                Track Order on WhatsApp
              </a>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-bold h-14 rounded-full transition-colors duration-200"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
                <button
                  onClick={() => downloadInvoicePdf("invoice-container", `invoice_${order.order_id}.pdf`)}
                  className="flex items-center justify-center gap-2 w-full border border-green-200 text-green-700 hover:bg-green-50 font-bold h-14 rounded-full transition-colors duration-200"
                >
                  <Download className="w-5 h-5" />
                  Save PDF
                </button>
              </div>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full text-gray-500 hover:text-green-600 font-bold h-12 mt-2 transition-colors duration-200"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
        {/* Hidden Invoice specifically for printing */}
        <Invoice order={order} settings={settings || undefined} />
      </CustomerLayout>
    );
  }

  // ── Checkout Form ─────────────────────────────────────────────────────────
  const minOrder = settings?.minimum_order_amount || 200;
  const canCheckout = total >= minOrder;

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32 lg:pb-10">
        <Link href="/cart" className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
              <h2 className="font-bold text-gray-900 text-xl mb-6">Delivery Details</h2>

              {[
                { key: "customer_name", label: "Full Name", placeholder: "Your full name", type: "text" },
                { key: "phone_number", label: "Phone Number", placeholder: "10-digit mobile number", type: "tel" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key} className="mb-5 relative group">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{label} *</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={`w-full px-5 h-14 bg-[#f8fafc] border rounded-2xl text-sm text-gray-900 font-medium transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-green-50 ${errors[key] ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-400"}`}
                  />
                  {errors[key] && <p className="text-red-500 text-xs mt-2 font-medium">{errors[key]}</p>}
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div className="relative group">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">House / Flat No. *</label>
                  <input type="text" value={form.house_no} onChange={(e) => setForm(f => ({ ...f, house_no: e.target.value }))} className={`w-full px-5 h-14 bg-[#f8fafc] border rounded-2xl text-sm text-gray-900 font-medium transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-green-50 ${errors.address ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-400"}`} placeholder="House No." />
                </div>
                <div className="relative group">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Street / Area *</label>
                  <input type="text" value={form.street} onChange={(e) => setForm(f => ({ ...f, street: e.target.value }))} className={`w-full px-5 h-14 bg-[#f8fafc] border rounded-2xl text-sm text-gray-900 font-medium transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-green-50 ${errors.address ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-400"}`} placeholder="Street or Area" />
                </div>
                <div className="relative group">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Landmark</label>
                  <input type="text" value={form.landmark} onChange={(e) => setForm(f => ({ ...f, landmark: e.target.value }))} className="w-full px-5 h-14 bg-[#f8fafc] border rounded-2xl text-sm text-gray-900 font-medium transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-green-50 border-gray-200 focus:border-green-400" placeholder="Optional Landmark" />
                </div>
                <div className="relative group">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">City *</label>
                  <input type="text" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} className={`w-full px-5 h-14 bg-[#f8fafc] border rounded-2xl text-sm text-gray-900 font-medium transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-green-50 ${errors.address ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-400"}`} placeholder="City" />
                </div>
                <div className="relative group">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Pincode *</label>
                  <input type="text" value={form.pincode} onChange={(e) => setForm(f => ({ ...f, pincode: e.target.value }))} className={`w-full px-5 h-14 bg-[#f8fafc] border rounded-2xl text-sm text-gray-900 font-medium transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-green-50 ${errors.address ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-400"}`} placeholder="Pincode" />
                </div>
                <div className="relative group">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Delivery Notes</label>
                  <input type="text" value={form.delivery_notes} onChange={(e) => setForm(f => ({ ...f, delivery_notes: e.target.value }))} className="w-full px-5 h-14 bg-[#f8fafc] border rounded-2xl text-sm text-gray-900 font-medium transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-green-50 border-gray-200 focus:border-green-400" placeholder="Instructions for driver" />
                </div>
              </div>
              {errors.address && <p className="text-red-500 text-xs mt-2 font-medium mb-5">{errors.address}</p>}

              <div className="relative group mt-5">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Pin Location on Map *</label>
                  <button type="button" onClick={handleUseCurrentLocation} className="text-green-600 hover:text-green-700 text-xs font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Use Current Location
                  </button>
                </div>
                <div className={`h-[250px] rounded-2xl overflow-hidden border z-0 ${errors.location || errors.delivery ? "border-red-300 focus-within:ring-4 focus-within:ring-red-50" : "border-gray-200 focus-within:ring-4 focus-within:ring-green-50"}`}>
                  <MapPicker
                    position={form.customer_latitude && form.customer_longitude ? { lat: form.customer_latitude, lng: form.customer_longitude } : null}
                    defaultCenter={settings?.store_latitude && settings?.store_longitude ? { lat: settings.store_latitude, lng: settings.store_longitude } : undefined}
                    onChange={handleLocationChange}
                  />
                </div>
                {errors.location && <p className="text-red-500 text-xs mt-2 font-medium">{errors.location}</p>}
                {errors.delivery && <p className="text-red-500 text-xs mt-2 font-medium">{errors.delivery}</p>}
                
                {locatingUser && (
                  <p className="text-blue-500 text-xs mt-2 font-medium animate-pulse">Detecting your location...</p>
                )}

                {validatingDelivery && !locatingUser && (
                  <p className="text-gray-500 text-xs mt-2 font-medium animate-pulse">Calculating delivery distance...</p>
                )}
                
                {deliveryInfo?.deliverable && deliveryInfo.distance_km && (
                  <p className="text-green-600 text-xs mt-2 font-medium">
                    Distance: {deliveryInfo.distance_km.toFixed(1)} km 
                    {deliveryInfo.delivery_charge > 0 
                      ? ` | Delivery Charge: ${formatCurrency(deliveryInfo.delivery_charge)}` 
                      : ' | Free Delivery!'}
                  </p>
                )}
              </div>
            </div>


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

            {!canCheckout && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                <p className="text-orange-800 font-bold text-sm">
                  Minimum order amount is {formatCurrency(minOrder)}
                </p>
                <p className="text-orange-600 text-xs mt-1 font-medium">
                  Your cart total is {formatCurrency(total)}. Add {formatCurrency(minOrder - total)} more.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canCheckout}
              className={`hidden lg:flex w-full items-center justify-center gap-2 font-bold h-16 rounded-full transition-all duration-200 text-lg ${
                canCheckout && !loading
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_14px_0_rgb(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              {loading ? "Placing Order..." : "Place Order"}
            </button>

            {/* Mobile Sticky Place Order Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-40">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Total</span>
                  <span className="text-xl font-bold text-gray-900 tracking-tight">{formatCurrency(total)}</span>
                </div>
                <button
                  type="submit"
                  disabled={loading || !canCheckout}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold h-14 px-6 rounded-full transition-all duration-200 ${
                    canCheckout && !loading
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_14px_0_rgb(22,163,74,0.39)]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <ShoppingBag className="w-5 h-5 hidden sm:block" />
                  {loading ? "Placing..." : "Place Order"}
                </button>
              </div>
            </div>
          </form>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 sticky top-24">
              <h2 className="font-bold text-gray-900 text-xl mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex-shrink-0 relative overflow-hidden">
                        <Image src={getImageUrl(product.image_url)} alt={product.name} fill className="object-contain p-1" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                          {product.is_weight_based ? formatWeight(quantity) : `${product.unit || "Kg"} × ${quantity}`}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 flex-shrink-0 text-sm">
                      {formatCurrency(product.is_weight_based ? (product.price * quantity) / 1000 : product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-200 pt-4 pb-2 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                
                {(deliveryInfo?.handling_charge || settings?.handling_charge || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Handling Charge</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(deliveryInfo?.handling_charge || settings?.handling_charge || 0)}
                    </span>
                  </div>
                )}
                
                {deliveryInfo && deliveryInfo.deliverable && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Delivery Charge</span>
                    <span className="font-bold text-gray-900">
                      {deliveryInfo.delivery_charge === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatCurrency(deliveryInfo.delivery_charge)
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-dashed border-gray-200 pt-5 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-lg">Total</span>
                <span className="font-black text-green-600 text-2xl tracking-tight">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
