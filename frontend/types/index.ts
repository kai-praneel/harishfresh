export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  subcategories: Subcategory[];
  created_at?: string;
  updated_at?: string;
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  stock_status: "in_stock" | "out_of_stock";
  is_featured: boolean;
  is_weight_based: boolean;
  available_stock: number | null;
  low_stock_threshold: number | null;
  is_active: boolean;
  unit: string;
  image_url: string | null;
  category_id: number;
  subcategory_id?: number;
  category?: { id: number; name: string; slug: string };
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  unit: string;
  is_weight_based: boolean;
}

export interface Order {
  id: number;
  order_id: string;
  customer_name: string;
  phone_number: string;
  address: string;
  house_no?: string;
  street?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  delivery_notes?: string;
  customer_latitude?: number;
  customer_longitude?: number;
  delivery_distance_km?: number;
  subtotal: number;
  delivery_charge: number;
  handling_charge: number;
  total_amount: number;
  status: "new" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  payment_method?: string;
  payment_status?: string;
  razorpay_payment_id?: string;
  tracking_token?: string;
  created_at: string;
  items: OrderItem[];
}

export interface Settings {
  id: number;
  whatsapp_number: string;
  minimum_order_amount: number;
  free_delivery_message: string;
  bulk_order_message: string;
  store_name: string;
  store_address: string;
  gmaps_link?: string;
  store_latitude?: number;
  store_longitude?: number;
  delivery_charges_enabled: boolean;
  max_delivery_radius_km: number;
  free_delivery_radius_km: number;
  delivery_charge_model: "none" | "flat" | "per_km";
  flat_delivery_fee: number;
  delivery_charge_per_km: number;
  handling_charge: number;
}

export interface DashboardStats {
  total_products: number;
  total_orders: number;
  new_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  new_orders_count: number;
}

export type OrderStatus = "new" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
export type SortOption = "default" | "price_asc" | "price_desc";
