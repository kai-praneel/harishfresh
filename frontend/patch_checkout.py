import re
import os

file_path = "/home/kai/Downloads/harishfresh_project/harishfresh/frontend/app/checkout/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

old_message_creation = """  if (order) {
    const message = `*New Order:* #${order.order_id}
*Customer:* ${order.customer_name}
*Phone:* ${order.phone_number}
*Address:* ${order.address}

*Items:*
${order.items.map((item, index) => {
  const qtyStr = item.is_weight_based ? formatWeight(item.quantity) : `${item.quantity} x ${item.unit || "Kg"}`;
  return `${index + 1}. ${item.product_name} - ${qtyStr} - ${formatCurrency(item.subtotal)}`;
}).join("\\n")}

*Total Amount:* ${formatCurrency(order.total_amount)}`;

    const waUrl = `https://wa.me/${settings?.whatsapp_number || "917396896009"}?text=${encodeURIComponent(message)}`;"""

new_message_creation = """  if (order) {
    const trackingUrl = order.tracking_token 
      ? `${window.location.origin}/track/${order.order_id}?token=${order.tracking_token}`
      : `${window.location.origin}/track`;

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
}).join("\\n")}

*Total Amount:* ${formatCurrency(order.total_amount)}`;

    const waUrl = `https://wa.me/${settings?.whatsapp_number || "917396896009"}?text=${encodeURIComponent(message)}`;"""

if old_message_creation in content:
    content = content.replace(old_message_creation, new_message_creation)


old_actions = """                <span className="text-gray-500 font-medium">Total</span>
                <span className="font-black text-gray-900 text-xl">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold h-14 rounded-[1.25rem] transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-0.5">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Send via WhatsApp
              </a>
              <button onClick={() => window.location.href = "/"} className="w-full bg-white text-gray-700 font-bold h-14 rounded-[1.25rem] border border-gray-200 transition-all hover:bg-gray-50 hover:border-gray-300">
                Continue Shopping
              </button>"""

new_actions = """                <span className="text-gray-500 font-medium">Total</span>
                <span className="font-black text-gray-900 text-xl">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <a href={trackingUrl} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold h-14 rounded-[1.25rem] transition-all shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5">
                Track Order
              </a>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold h-14 rounded-[1.25rem] transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-0.5">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Send via WhatsApp
              </a>
              <button onClick={() => window.location.href = "/"} className="w-full bg-white text-gray-700 font-bold h-14 rounded-[1.25rem] border border-gray-200 transition-all hover:bg-gray-50 hover:border-gray-300">
                Continue Shopping
              </button>"""

if old_actions in content:
    content = content.replace(old_actions, new_actions)

with open(file_path, "w") as f:
    f.write(content)

print("checkout updated successfully")
