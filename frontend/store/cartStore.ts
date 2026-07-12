import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  addItemWithQty: (product: Product, qty: number) => void;
  removeItem: (productId: number) => void;
  increaseQty: (productId: number) => void;
  decreaseQty: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const existing = get().items.find((i) => i.product.id === product.id);
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }));
        } else {
          set((s) => ({ items: [...s.items, { product, quantity: 1 }] }));
        }
      },

      addItemWithQty: (product, qty) => {
        const existing = get().items.find((i) => i.product.id === product.id);
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i
            ),
          }));
        } else {
          set((s) => ({ items: [...s.items, { product, quantity: qty }] }));
        }
      },

      removeItem: (productId) => {
        set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) }));
      },

      increaseQty: (productId) => {
        set((s) => ({
          items: s.items.map((i) =>
            i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }));
      },

      decreaseQty: (productId) => {
        const item = get().items.find((i) => i.product.id === productId);
        if (item && item.quantity <= 1) {
          set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) }));
        } else {
          set((s) => ({
            items: s.items.map((i) =>
              i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
            ),
          }));
        }
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) }));
        } else {
          set((s) => ({
            items: s.items.map((i) =>
              i.product.id === productId ? { ...i, quantity: qty } : i
            ),
          }));
        }
      },

      clearCart: () => set({ items: [] }),

      totalAmount: () =>
        get().items.reduce((sum, i) => {
          if (i.product.is_weight_based) {
            return sum + (i.product.price * i.quantity) / 1000;
          }
          return sum + i.product.price * i.quantity;
        }, 0),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "harishfresh-cart" }
  )
);
