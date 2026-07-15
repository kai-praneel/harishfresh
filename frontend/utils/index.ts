import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Order } from "../types";

export function generateRiderMessage(order: Order): string {
  const itemsList = (order.items || []).map(item => {
    const qtyStr = item.is_weight_based ? formatWeight(item.quantity, item.unit) : `${item.quantity} x ${item.unit || "Kg"}`;
    return `- ${qtyStr} x ${item.product_name}`;
  }).join('\n');
  
  const addressParts: string[] = [];
  if (order.house_no) addressParts.push(order.house_no);
  if (order.street) addressParts.push(order.street);
  if (order.landmark) addressParts.push(order.landmark);
  
  if (order.city || order.pincode) {
    const cityPin = [order.city, order.pincode].filter(Boolean).join(" - ");
    if (cityPin) addressParts.push(cityPin);
  }

  const formattedAddress = addressParts.length > 0 ? addressParts.join('\n') : order.address;

  let text = `[ NEW DELIVERY ASSIGNMENT ]\n\n` +
    `*Order Number:* ${order.order_id}\n\n` +
    `*Customer:* ${order.customer_name}\n` +
    `*Phone:* ${order.phone_number}\n\n` +
    `*Delivery Address:*\n${formattedAddress}\n\n` +
    `*Payment:* COD (Pending)\n` +
    `*Order Total:* Rs. ${order.total_amount}\n\n` +
    `*Items:*\n${itemsList}\n`;

  if (order.delivery_notes && order.delivery_notes.trim()) {
    text += `\n*Delivery Notes:*\n${order.delivery_notes.trim()}\n`;
  }

  text += `\n*Navigation:*\nhttps://www.google.com/maps/dir/?api=1&destination=${order.customer_latitude},${order.customer_longitude}\n\n` +
    `Note: Please call the customer before arrival if required.`;

  return text;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatWeight(amount: number, unitStr?: string): string {
    const mainUnit = unitStr || 'Kg';
  let subUnit = 'g';
  if (mainUnit.toLowerCase() === 'litre' || mainUnit.toLowerCase() === 'l') {
    subUnit = 'ml';
  } else if (mainUnit.toLowerCase() === 'kg') {
    subUnit = 'g';
  } else if (mainUnit.toLowerCase() === 'gram' || mainUnit.toLowerCase() === 'g') {
    subUnit = 'mg';
  } else {
    return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 2)} ${mainUnit}`;
  }

  if (amount >= 1000) {
    const kg = Math.floor(amount / 1000);
    const rem = amount % 1000;
    if (rem === 0) return `${kg} ${mainUnit}`;
    return `${kg} ${mainUnit} ${rem} ${subUnit}`;
  }
  return `${amount} ${subUnit}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "new": return "bg-blue-100 text-blue-800";
    case "confirmed": return "bg-yellow-100 text-yellow-800";
    case "delivered": return "bg-green-100 text-green-800";
    case "cancelled": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "new": return "New";
    case "confirmed": return "Confirmed";
    case "delivered": return "Delivered";
    case "cancelled": return "Cancelled";
    default: return status;
  }
}

export function extractRadius(message?: string): string {
  if (!message) return "5km";
  const match = message.match(/(\d+\s*km)/i);
  return match ? match[1].toLowerCase().replace(/\s/g, "") : "5km";
}
