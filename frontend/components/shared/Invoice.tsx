"use client";

import { Order, Settings } from "@/types";

export default function Invoice({ order, settings }: { order: Order; settings?: Settings }) {
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amt: number) => `₹${amt.toFixed(2)}`;

  return (
    <div className="hidden print:block bg-white p-8 max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-sm" id="invoice-container">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-green-700">
            {settings?.store_name || "HarishFresh"}
          </h1>
          <p className="text-gray-500 mt-1 whitespace-pre-line">{settings?.store_address || "Hyderabad, India"}</p>
          
          {order.tracking_token && (
            <div className="mt-4 flex items-center gap-3">
              <img 
                src={`https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/track/${order.order_id}?token=${order.tracking_token}`)}`} 
                alt="Track Order QR"
                className="w-16 h-16 border border-gray-200 rounded-lg"
              />
              <div className="text-sm">
                <p className="font-semibold text-gray-700">Track your order</p>
                <p className="text-xs text-gray-500 mt-0.5">Scan QR code or click link</p>
                <a 
                  href={`${typeof window !== 'undefined' ? window.location.origin : ''}/track/${order.order_id}?token=${order.tracking_token}`}
                  className="text-green-600 font-medium hover:underline inline-block mt-1 print:text-black"
                >
                  Track Order Online
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800 tracking-wide uppercase">INVOICE</h2>
          <p className="text-gray-500 text-sm mt-1">Invoice No: {order.order_id}</p>
          <p className="text-gray-500 text-sm">Date: {formatDate(order.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Bill To */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
          <p className="text-gray-800 font-bold">{order.customer_name}</p>
          <p className="text-gray-600">{order.phone_number}</p>
          <p className="text-gray-600 whitespace-pre-line leading-relaxed">{order.address}</p>
        </div>
        {/* Order Details */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Order Summary</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="text-gray-500 py-1">Order Status</td><td className="font-medium text-gray-800 py-1 uppercase">{order.status.replace(/_/g, ' ')}</td></tr>
              <tr>
                <td className="text-gray-500 py-1">Payment Method</td>
                <td className="font-medium text-gray-800 py-1">
                  {order.payment_method === 'online' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}
                </td>
              </tr>
              <tr>
                <td className="text-gray-500 py-1">Payment Status</td>
                <td className="font-medium text-gray-800 py-1 capitalize">
                  {order.payment_status || 'Pending'}
                </td>
              </tr>
              {order.razorpay_payment_id && (
                <tr>
                  <td className="text-gray-500 py-1">Transaction ID</td>
                  <td className="font-medium text-gray-800 py-1 font-mono text-xs">
                    {order.razorpay_payment_id}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="border-b-2 border-gray-200 text-gray-800 text-sm uppercase tracking-wider">
            <th className="py-3 font-semibold w-12 text-center">#</th>
            <th className="py-3 font-semibold">Item</th>
            <th className="py-3 font-semibold text-right w-24">Qty</th>
            <th className="py-3 font-semibold text-right w-32">Price</th>
            <th className="py-3 font-semibold text-right w-32">Total</th>
          </tr>
        </thead>
        <tbody className="text-gray-700 text-sm">
          {order.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-3 text-center text-gray-500">{i + 1}</td>
              <td className="py-3 font-medium">{item.product_name}</td>
              <td className="py-3 text-right">{item.quantity} {item.unit || "Kg"}</td>
              <td className="py-3 text-right">{formatCurrency(item.product_price)}</td>
              <td className="py-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72">
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-800 font-medium">{formatCurrency(order.subtotal || 0)}</span>
          </div>
          {(order.delivery_charge || 0) > 0 && (
            <div className="flex justify-between py-2 text-sm border-t border-gray-100">
              <span className="text-gray-600">Delivery Charge</span>
              <span className="text-gray-800 font-medium">{formatCurrency(order.delivery_charge)}</span>
            </div>
          )}
          {(order.handling_charge || 0) > 0 && (
            <div className="flex justify-between py-2 text-sm border-t border-gray-100">
              <span className="text-gray-600">Handling Charge</span>
              <span className="text-gray-800 font-medium">{formatCurrency(order.handling_charge)}</span>
            </div>
          )}
          <div className="flex justify-between py-4 text-xl font-bold text-gray-900 border-t-2 border-gray-200 mt-2">
            <span>Grand Total</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="mt-16 text-center text-gray-500 text-sm border-t border-gray-200 pt-8">
        <p className="font-semibold text-gray-600 mb-1">Thank you for your business!</p>
        <p>If you have any questions about this invoice, please contact {settings?.whatsapp_number || "us"}</p>
      </div>
    </div>
  );
}
