"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { ordersApi, settingsApi } from "@/services/api";
import { Order, Settings } from "@/types";
import { Loader2, Package, Truck, CheckCircle, Clock, AlertCircle, XCircle, Download } from "lucide-react";
import toast from "react-hot-toast";
import { formatWeight } from "@/utils";
import Invoice from "@/components/shared/Invoice";
import { downloadInvoicePdf } from "@/utils/pdf";

const STATUS_STEPS = [
  { id: 'new', label: 'Order Placed', icon: Package },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { id: 'preparing', label: 'Preparing', icon: Clock },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function OrderTrackingPage({ params }: { params: Promise<{ order_id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const { order_id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const fetchOrder = async () => {
    if (!token) {
      router.push("/track");
      return;
    }
    try {
      setLoading(true);
      const [res, settingsRes] = await Promise.all([
        ordersApi.track(order_id, token),
        settingsApi.get()
      ]);
      setOrder(res.data);
      setSettings(settingsRes.data);
      setError("");
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Invalid or expired tracking token. Please verify your order again.");
        router.push("/track");
      } else {
        setError(err.response?.data?.detail || "Failed to load order details");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [order_id, token]);

  const handleCancel = async () => {
    if (!token || !order) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      setCancelling(true);
      const res = await ordersApi.cancelCustomer(order.order_id, token);
      setOrder(res.data);
      toast.success("Order cancelled successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrency = (amt: number) => `₹${amt.toFixed(2)}`;

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading tracking details...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !order) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-red-50 text-red-500 p-8 rounded-2xl flex flex-col items-center">
            <AlertCircle className="w-12 h-12 mb-4" />
            <h2 className="text-xl font-bold mb-2">Tracking Error</h2>
            <p className="text-red-400 font-medium">{error || "Order not found"}</p>
            <button 
              onClick={() => router.push("/track")}
              className="mt-6 px-6 py-2 bg-white text-red-600 font-bold rounded-xl shadow-sm border border-red-100"
            >
              Back to Order Recovery
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = isCancelled ? -1 : STATUS_STEPS.findIndex(s => s.id === order.status);
  const canCancel = !isCancelled && (order.status === "new" || order.status === "confirmed");

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Order #{order.order_id}</h1>
            <p className="text-gray-500 mt-1">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          {isCancelled ? (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold inline-flex items-center gap-2 self-start md:self-auto border border-red-200">
              <XCircle className="w-5 h-5" />
              Cancelled
            </div>
          ) : (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold inline-flex items-center gap-2 self-start md:self-auto border border-green-200 capitalize">
              <Truck className="w-5 h-5" />
              {order.status.replace(/_/g, ' ')}
            </div>
          )}
        </div>

        {!isCancelled && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 md:p-10 mb-8">
            <h2 className="font-bold text-gray-800 mb-8 text-lg">Tracking Status</h2>
            <div className="relative">
              <div className="absolute left-6 md:left-auto md:top-6 bottom-0 md:bottom-auto w-0.5 md:w-full h-full md:h-0.5 bg-gray-100" />
              <div className="absolute left-6 md:left-auto md:top-6 bottom-0 md:bottom-auto w-0.5 md:w-full h-full md:h-0.5 bg-green-500 transition-all duration-500" 
                style={{
                  height: typeof window !== 'undefined' && window.innerWidth < 768 ? `${Math.max(0, currentStepIndex) * 25}%` : undefined,
                  width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${Math.max(0, currentStepIndex) * 25}%` : undefined
                }} 
              />
              
              <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-4">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = currentStepIndex >= index;
                  const isCurrent = currentStepIndex === index;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-3 z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-300 ${
                        isCompleted 
                          ? 'bg-green-500 border-green-100 text-white' 
                          : 'bg-white border-gray-100 text-gray-300'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="md:text-center">
                        <p className={`font-bold text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-green-600 font-medium mt-0.5">Current Status</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 md:p-8">
              <h2 className="font-bold text-gray-800 mb-6 text-lg border-b border-gray-100 pb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.is_weight_based ? formatWeight(item.quantity, item.unit) : `${item.quantity} ${item.unit || "Kg"}`}
                      </p>
                    </div>
                    <p className="font-black text-gray-900">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 md:p-8">
              <h2 className="font-bold text-gray-800 mb-6 text-lg border-b border-gray-100 pb-4">Delivery Details</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
                  <p className="font-bold text-gray-900">{order.customer_name}</p>
                  <p className="text-gray-600">{order.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Address</p>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{order.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6">
              <h2 className="font-bold text-gray-800 mb-6 text-lg border-b border-gray-100 pb-4">Payment Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Payment Method</span>
                  <span className="font-bold text-gray-900">
                    {order.payment_method === 'online' ? 'Online' : 'COD'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Payment Status</span>
                  <span className={`font-bold capitalize ${order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'refunded' ? 'text-blue-600' : 'text-orange-500'}`}>
                    {order.payment_status || 'Pending'}
                  </span>
                </div>
                {order.razorpay_payment_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Transaction ID</span>
                    <span className="font-mono text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded truncate max-w-[120px]">
                      {order.razorpay_payment_id}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-dashed border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-900">{formatCurrency(order.subtotal || 0)}</span>
                </div>
                {(order.delivery_charge || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery</span>
                    <span className="font-bold text-gray-900">{formatCurrency(order.delivery_charge)}</span>
                  </div>
                )}
                {(order.handling_charge || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Handling</span>
                    <span className="font-bold text-gray-900">{formatCurrency(order.handling_charge)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-gray-800 font-bold">Total</span>
                  <span className="text-2xl font-black text-green-600">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 text-center">
              <button
                onClick={() => downloadInvoicePdf("invoice-container", `invoice_${order.order_id}.pdf`)}
                className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-3 rounded-xl border border-green-200 transition-colors shadow-sm"
              >
                <Download className="w-5 h-5" />
                Download Invoice
              </button>
            </div>

            {canCancel && (
              <div className="bg-red-50 rounded-3xl border border-red-100 p-6 text-center">
                <h3 className="font-bold text-red-800 mb-2">Need to cancel?</h3>
                <p className="text-sm text-red-600 mb-4">You can cancel your order before it starts being prepared.</p>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full bg-white hover:bg-red-50 text-red-600 font-bold py-3 rounded-xl border border-red-200 transition-colors shadow-sm disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Cancel Order"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Invoice order={order} settings={settings || undefined} />
    </CustomerLayout>
  );
}
