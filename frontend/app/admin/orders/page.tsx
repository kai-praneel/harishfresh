"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingBag, Search, Loader2, ChevronDown, ChevronUp, Phone, MapPin, Clock, Package, Printer, Download } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Invoice from "@/components/shared/Invoice";
import { downloadInvoicePdf } from "@/utils/pdf";
import { ordersApi, settingsApi } from "@/services/api";
import { Order, OrderStatus, Settings } from "@/types";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, generateRiderMessage, formatWeight } from "@/utils";
import toast from "react-hot-toast";

const TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "New", value: "new" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Preparing", value: "preparing" },
  { label: "Out for Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const NEXT_STATUS: Record<string, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("status") || "");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [riderPhone, setRiderPhone] = useState("");

  const fetchOrders = async (status?: string) => {
    try {
      const res = await ordersApi.list(status || undefined);
      setOrders(res.data);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchOrders(activeTab); 
    settingsApi.get().then((res) => setSettings(res.data)).catch(() => {});
  }, [activeTab]);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.order_id.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.phone_number.includes(q);
  });

  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast.success(`Order ${getStatusLabel(newStatus).toLowerCase()}`);
      await fetchOrders(activeTab);
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Failed to update status"); }
    finally { setUpdatingId(null); }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value); setLoading(true); setExpandedId(null); setRiderPhone("");
  };

  const tabCounts = (status: string) => {
    if (status === "") return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage customer orders</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.value ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6"><div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order ID, name, or phone..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
      </div></div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map((i) => (<div key={i} className="bg-white rounded-xl border border-gray-100 p-5"><div className="flex items-center gap-4"><div className="h-10 w-10 skeleton rounded-lg" /><div className="flex-1 space-y-2"><div className="h-4 skeleton rounded w-1/3" /><div className="h-3 skeleton rounded w-1/4" /></div></div></div>))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">{search ? "No orders match your search" : activeTab ? `No ${getStatusLabel(activeTab).toLowerCase()} orders` : "No orders yet"}</h3>
          <p className="text-gray-400 text-sm">
            {search ? "Try a different search term" : "Orders will appear here when customers place them"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const expanded = expandedId === order.id;
            const nextStatuses = NEXT_STATUS[order.status] || [];
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer" onClick={() => { setExpandedId(expanded ? null : order.id); setRiderPhone(""); }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${order.status === "new" ? "bg-blue-50" : order.status === "confirmed" ? "bg-yellow-50" : order.status === "delivered" ? "bg-green-50" : "bg-red-50"}`}>
                      <ShoppingBag className={`w-4 h-4 ${order.status === "new" ? "text-blue-600" : order.status === "confirmed" ? "text-yellow-600" : order.status === "delivered" ? "text-green-600" : "text-red-600"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">{order.order_id}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{order.customer_name} • {order.phone_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 pl-12 sm:pl-0">
                    <div className="text-right">
                      <p className="font-bold text-green-700 text-sm">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="hidden sm:block text-right min-w-[120px]">
                      <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div className="border-t border-gray-100 px-4 sm:px-5 py-4 bg-gray-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Details</h4>
                        <div className="flex items-start gap-2 text-sm text-gray-700"><ShoppingBag className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /><span>{order.customer_name}</span></div>
                        <div className="flex items-start gap-2 text-sm text-gray-700"><Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /><span>{order.phone_number}</span></div>
                        <div className="flex items-start gap-2 text-sm text-gray-700"><MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /><span>{order.address}</span></div>
                        <div className="flex items-start gap-2 text-sm text-gray-700 sm:hidden"><Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /><span>{formatDate(order.created_at)}</span></div>

                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">Payment Details</h4>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="font-medium w-16">Method:</span>
                          <span className="capitalize">{order.payment_method === 'online' ? 'Razorpay' : 'COD'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="font-medium w-16">Status:</span>
                          <span className={`capitalize px-2 py-0.5 rounded text-xs font-bold ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                            order.payment_status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>{order.payment_status || 'pending'}</span>
                        </div>
                        {order.razorpay_payment_id && (
                          <div className="flex items-start gap-2 text-sm text-gray-700 mt-1">
                            <span className="font-medium w-16">Txn ID:</span>
                            <span className="font-mono text-xs break-all">{order.razorpay_payment_id}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Order Items</h4>
                        <div className="space-y-1.5">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{item.product_name} <span className="text-gray-400">× {item.is_weight_based ? formatWeight(item.quantity, item.unit) : `${item.quantity} ${item.unit || "Kg"}`}</span></span>
                              <span className="text-gray-600 font-medium">{formatCurrency(item.subtotal)}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-800">Total</span>
                            <span className="text-green-700">{formatCurrency(order.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rider Handoff */}
                    {(order.status === "preparing" || order.status === "out_for_delivery") && (
                      <div className="pt-4 border-t border-gray-200 mt-4 px-4 sm:px-6 mb-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rider Handoff</h4>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Rider Phone (e.g. 919876543210)" 
                            value={riderPhone}
                            onChange={(e) => setRiderPhone(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                          />
                          <button
                            onClick={() => {
                              if (!riderPhone.trim() || !/^\d{10,15}$/.test(riderPhone.replace(/[+\s-]/g, ""))) {
                                toast.error("Please enter a valid rider phone number");
                                return;
                              }
                              if (!order.customer_latitude || !order.customer_longitude) {
                                toast.error("Customer location is missing for this order. Cannot generate navigation link.");
                                return;
                              }
                              
                              const text = generateRiderMessage(order);
                              window.open(`https://wa.me/${riderPhone.replace(/[+\s-]/g, "")}?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                            </svg>
                            Share to Rider
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions and Print */}
                    <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-200 mt-4">
                      {nextStatuses.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-gray-500 self-center mr-1">Update status:</span>
                          {nextStatuses.map((ns) => (
                            <button key={ns} onClick={() => handleStatusUpdate(order.id, ns)} disabled={updatingId === order.id}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                                ns === "confirmed" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                                ns === "delivered" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                                "bg-red-100 text-red-800 hover:bg-red-200"
                              }`}>
                              {updatingId === order.id && <Loader2 className="w-3 h-3 animate-spin" />}
                              Mark {getStatusLabel(ns)}
                            </button>
                          ))}
                        </div>
                      ) : <div />}
                      
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {order.customer_latitude && order.customer_longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${order.customer_latitude},${order.customer_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Navigate
                          </a>
                        )}
                        <button onClick={() => window.print()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </button>
                        <button onClick={() => downloadInvoicePdf("invoice-container", `invoice_${order.order_id}.pdf`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
                          <Download className="w-3.5 h-3.5" />
                          Save PDF
                        </button>
                      </div>
                    </div>

                    <Invoice order={order} settings={settings || undefined} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1 text-sm">Loading orders...</p>
        </div>
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 skeleton rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-1/3" />
                  <div className="h-3 skeleton rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminLayout>
    }>
      <OrdersContent />
    </Suspense>
  );
}
