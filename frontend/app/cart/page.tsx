"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { useCartStore } from "@/store/cartStore";
import { settingsApi, getImageUrl } from "@/services/api";
import { formatCurrency, extractRadius, formatWeight } from "@/utils";
import WeightSelectorModal from "@/components/customer/WeightSelectorModal";

export default function CartPage() {
  const { items, removeItem, increaseQty, decreaseQty, updateQty, totalAmount } = useCartStore();
  const [minOrder, setMinOrder] = useState(200);
  const [deliveryRadius, setDeliveryRadius] = useState("5km");
  const [mounted, setMounted] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const total = totalAmount();

  const handleIncreaseQty = (product: any, currentQty: number) => {
    if (product.available_stock !== null && product.available_stock !== undefined && currentQty >= product.available_stock) {
      return;
    }
    increaseQty(product.id);
  };

  useEffect(() => {
    setMounted(true);
    settingsApi.get().then((r) => {
      setMinOrder(r.data.minimum_order_amount || 200);
      setDeliveryRadius(extractRadius(r.data.free_delivery_message));
    }).catch(() => {});
  }, []);

  if (!mounted) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-8 bg-gray-100 rounded w-1/4 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
            <div className="lg:col-span-1">
              <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <ShoppingCart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Add some fresh products to get started!</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const canCheckout = total >= minOrder;

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32 lg:pb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 bg-white rounded-3xl p-4 sm:p-5 border border-transparent hover:border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-200"
              >
                <Link href={`/product/${product.id}`} className="flex-shrink-0">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white border border-gray-100 p-2">
                    <Image
                      src={getImageUrl(product.image_url)}
                      alt={product.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                </Link>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium mb-0.5 uppercase tracking-wider">
                        {product.category?.name}
                      </p>
                      <Link href={`/product/${product.id}`}>
                        <h3 className="font-bold text-gray-800 text-sm sm:text-base line-clamp-2 hover:text-green-600 transition-colors duration-200">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium">
                        Unit: {product.unit || "Kg"}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-end justify-between mt-3">
                    {product.is_weight_based ? (
                      <button
                        onClick={() => setEditingProduct({ product, quantity })}
                        className="flex items-center justify-center bg-green-50 text-green-700 border border-green-200 rounded-xl overflow-hidden h-9 px-4 shadow-sm text-sm font-bold hover:bg-green-100 transition-colors"
                      >
                        {formatWeight(quantity, product.unit)}
                      </button>
                    ) : (
                      <div className="flex items-center border border-gray-200 rounded-full overflow-hidden bg-white h-9 shadow-sm">
                        <button
                          onClick={() => decreaseQty(product.id)}
                          className="w-9 h-full flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-gray-900">{quantity}</span>
                        <button
                          onClick={() => handleIncreaseQty(product, quantity)}
                          disabled={product.available_stock !== null && product.available_stock !== undefined && quantity >= product.available_stock}
                          className={`w-9 h-full flex items-center justify-center transition-colors ${
                            product.available_stock !== null && product.available_stock !== undefined && quantity >= product.available_stock
                              ? "text-gray-300 cursor-not-allowed bg-gray-50"
                              : "text-gray-500 hover:text-green-600 hover:bg-gray-50"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col items-end">
                      <span className="font-price text-gray-900 text-lg tracking-tight">
                        {formatCurrency(product.is_weight_based ? (product.price * quantity) / 1000 : product.price * quantity)}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        ({formatCurrency(product.price)} / {product.unit || "Kg"})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 sticky top-24">
              <h2 className="font-bold text-gray-900 text-xl mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="text-gray-900">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>Delivery</span>
                  <span className="text-green-600">Free (within {deliveryRadius})</span>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-4 mt-2 flex justify-between font-bold text-gray-900 text-xl">
                  <span>Total</span>
                  <span className="text-green-700">{formatCurrency(total)}</span>
                </div>
              </div>

              {!canCheckout && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6">
                  <p className="text-orange-800 text-sm font-bold">
                    Minimum order amount is {formatCurrency(minOrder)}
                  </p>
                  <p className="text-orange-600 text-xs mt-1 font-medium">
                    Add {formatCurrency(minOrder - total)} more to proceed
                  </p>
                </div>
              )}

              <Link
                href="/checkout"
                className={`hidden lg:flex items-center justify-center font-bold h-14 px-6 rounded-full transition-all duration-200 ${
                  canCheckout
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_14px_0_rgb(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                }`}
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>

              <Link
                href="/search"
                className="flex items-center justify-center text-sm font-bold text-green-600 hover:text-green-700 mt-6 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Total ({items.length} items)</span>
            <span className="text-xl font-bold text-gray-900 tracking-tight">{formatCurrency(total)}</span>
          </div>
          <Link
            href="/checkout"
            className={`flex-1 flex items-center justify-center font-bold h-14 px-6 rounded-full transition-all duration-200 ${
              canCheckout
                ? "bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_14px_0_rgb(22,163,74,0.39)]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
            }`}
          >
            Checkout
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
        {!canCheckout && (
          <p className="text-center text-xs text-orange-600 font-bold mt-3">
            Add {formatCurrency(minOrder - total)} more to order
          </p>
        )}
      </div>

      {editingProduct && (
        <WeightSelectorModal
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          product={editingProduct.product}
          initialWeight={editingProduct.quantity}
          onSave={(grams) => {
            updateQty(editingProduct.product.id, grams);
            setEditingProduct(null);
          }}
        />
      )}
    </CustomerLayout>
  );
}
