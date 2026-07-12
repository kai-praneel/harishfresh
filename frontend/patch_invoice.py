import re
import os

file_path = "/home/kai/Downloads/harishfresh_project/harishfresh/frontend/components/shared/Invoice.tsx"
with open(file_path, "r") as f:
    content = f.read()

old_head = """    <div className="hidden print:block bg-white p-8 max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-sm" id="invoice-container">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-green-700">
            {settings?.store_name || "HarishFresh"}
          </h1>
          <p className="text-gray-500 mt-1 whitespace-pre-line">{settings?.store_address || "Hyderabad, India"}</p>
        </div>"""

new_head = """    <div className="hidden print:block bg-white p-8 max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-sm" id="invoice-container">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-green-700">
            {settings?.store_name || "HarishFresh"}
          </h1>
          <p className="text-gray-500 mt-1 whitespace-pre-line">{settings?.store_address || "Hyderabad, India"}</p>
          
          {order.tracking_token && typeof window !== 'undefined' && (
            <div className="mt-4 flex items-center gap-3">
              <img 
                src={`https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${encodeURIComponent(`${window.location.origin}/track/${order.order_id}?token=${order.tracking_token}`)}`} 
                alt="Track Order QR"
                className="w-16 h-16 border border-gray-200 rounded-lg"
              />
              <div className="text-sm">
                <p className="font-semibold text-gray-700">Track your order</p>
                <p className="text-xs text-gray-500 mt-0.5">Scan QR code or click link</p>
                <a 
                  href={`${window.location.origin}/track/${order.order_id}?token=${order.tracking_token}`}
                  className="text-green-600 font-medium hover:underline inline-block mt-1 print:text-black"
                >
                  Track Order Online
                </a>
              </div>
            </div>
          )}
        </div>"""

if old_head in content:
    content = content.replace(old_head, new_head)

with open(file_path, "w") as f:
    f.write(content)

print("Invoice patched successfully")
