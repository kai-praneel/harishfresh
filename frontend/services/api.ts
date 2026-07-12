import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach token for admin requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("hf_admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/admin") && !path.includes("/login")) {
        localStorage.removeItem("hf_admin_token");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(err);
  }
);

export const getImageUrl = (url?: string | null) => {
  if (!url) return "/placeholder-product.jpg";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    api.post("/auth/login", { username, password }),
  me: () => api.get("/auth/me"),
};

// ── Categories ────────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () => api.get("/categories/"),
  get: (slug: string) => api.get(`/categories/${slug}`),
  create: (data: { name: string; description?: string }) =>
    api.post("/categories/", data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// ── Subcategories ─────────────────────────────────────────────────────────────

export const subcategoriesApi = {
  list: (category_id?: number) =>
    api.get("/subcategories/", { params: { category_id } }),
  get: (slug: string) => api.get(`/subcategories/${slug}`),
  create: (data: { name: string; category_id: number; description?: string }) =>
    api.post("/subcategories/", data),
  update: (id: number, data: any) => api.put(`/subcategories/${id}`, data),
  delete: (id: number) => api.delete(`/subcategories/${id}`),
};

// ── Products ──────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: {
    category_id?: number;
    subcategory_id?: number;
    featured?: boolean;
    search?: string;
    sort?: string;
  }) => api.get("/products/", { params }),
  get: (id: number) => api.get(`/products/${id}`),
  create: (formData: FormData) =>
    api.post("/products/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, formData: FormData) =>
    api.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: number) => api.delete(`/products/${id}`),
  deleteImage: (id: number) => api.delete(`/products/${id}/image`),
};

// ── Orders ────────────────────────────────────────────────────────────────────

export const ordersApi = {
  place: (data: {
    customer_name: string;
    phone_number: string;
    address: string;
    customer_latitude?: number | null;
    customer_longitude?: number | null;
    items: { product_id: number; quantity: number }[];
  }) => api.post("/orders/", data),
  initiatePayment: (data: {
    customer_name: string;
    phone_number: string;
    address: string;
    customer_latitude?: number | null;
    customer_longitude?: number | null;
    items: { product_id: number; quantity: number }[];
  }) => api.post("/orders/initiate-payment", data),
  verifyAndPlaceOrder: (data: {
    customer_name: string;
    phone_number: string;
    address: string;
    customer_latitude?: number | null;
    customer_longitude?: number | null;
    items: { product_id: number; quantity: number }[];
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post("/orders/verify-and-place", data),
  list: (status?: string) => api.get("/orders/", { params: { status } }),
  get: (id: number) => api.get(`/orders/${id}`),
  track: (orderId: string, token: string) => api.get(`/orders/track/${orderId}?token=${token}`),
  recoverOrder: (order_id: string, phone_number: string) => api.post("/orders/track/recover", { order_id, phone_number }),
  cancelCustomer: (orderId: string, token: string) => api.post(`/orders/track/${orderId}/cancel?token=${token}`),
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  stats: () => api.get("/orders/stats"),
  poll: () => api.get("/orders/poll"),
};

// ── Settings ──────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () => api.get("/settings/"),
  update: (data: any) => api.put("/settings/", data),
  extractLocation: (url: string) => api.post("/settings/extract-location", { url }),
};

// ── Delivery ──────────────────────────────────────────────────────────────────

export const deliveryApi = {
  validate: (data: { customer_latitude: number, customer_longitude: number, subtotal: number }) => 
    api.post("/delivery/validate", data)
};
