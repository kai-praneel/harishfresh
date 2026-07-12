"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { api, ordersApi } from "@/services/api";
import { Search, Phone, ShoppingBag, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function OrderRecoveryPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !phone) {
      toast.error("Please enter both Order ID and Phone Number");
      return;
    }

    setLoading(true);
    try {
      const res = await ordersApi.recoverOrder(orderId.trim(), phone.trim());
      const token = res.data.tracking_token;
      const canonicalOrderId = res.data.order_id || orderId.trim().toUpperCase();
      toast.success("Order verified successfully!");
      router.push(`/track/${canonicalOrderId}?token=${token}`);
    } catch (err: any) {
      setLoading(false);
      toast.error(err.response?.data?.detail || "Invalid Order ID or Phone Number");
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-md mx-auto px-4 py-16 lg:py-24">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
          
          <div className="relative w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-green-600" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Track Your Order</h1>
            <p className="text-gray-500 text-sm">Enter your Order ID and the phone number used during checkout to view your order details.</p>
          </div>

          <form onSubmit={handleRecover} className="space-y-4 relative">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Order ID</label>
              <div className="relative">
                <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. ORD-12345"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Track Order"
              )}
            </button>
          </form>
        </div>
      </div>
    </CustomerLayout>
  );
}
