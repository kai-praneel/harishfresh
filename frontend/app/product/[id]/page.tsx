"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ArrowLeft, ChevronRight, Minus, Plus, ShieldCheck, Zap, Award } from "lucide-react";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { productsApi, getImageUrl } from "@/services/api";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";
import { formatCurrency, formatWeight } from "@/utils";
import toast from "react-hot-toast";
import ProductCard from "@/components/customer/ProductCard";
import WeightSelectorModal from "@/components/customer/WeightSelectorModal";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const { addItemWithQty, items, updateQty } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItem = items.find((i) => i.product.id === product?.id);
  const isOutOfStock = product?.stock_status === "out_of_stock" || 
    (product?.is_weight_based && product?.available_stock !== null && product?.available_stock !== undefined && product?.available_stock <= 0);
  
  const hasDiscount = product?.mrp && product.mrp > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) 
    : 0;

  useEffect(() => {
    productsApi
      .get(parseInt(id))
      .then((r) => {
        setProduct(r.data);
        if (r.data.category_id) {
          productsApi.list({ category_id: r.data.category_id }).then((res) => {
            const filtered = res.data.filter((p: Product) => p.id !== r.data.id).slice(0, 4);
            setRelatedProducts(filtered);
          });
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    if (product.is_weight_based) {
      setShowWeightModal(true);
      return;
    }
    const currentQty = cartItem ? cartItem.quantity : 0;
    if (product.available_stock !== null && product.available_stock !== undefined && currentQty + qty > product.available_stock) {
      toast.error("The selected quantity is currently unavailable. Please choose a lower quantity.");
      return;
    }
    addItemWithQty(product, qty);
    toast.success(`${product.name} added to cart`);
  };

  const handleIncrease = () => {
    if (!product) return;
    const currentQty = cartItem ? cartItem.quantity : 0;
    if (product.available_stock !== null && product.available_stock !== undefined && currentQty + qty + 1 > product.available_stock) {
      toast.error("The selected quantity is currently unavailable. Please choose a lower quantity.");
      return;
    }
    setQty(qty + 1);
  };

  const handleSaveWeight = (grams: number) => {
    if (!product) return;
    if (cartItem) {
      updateQty(product.id, grams);
    } else {
      addItemWithQty(product, grams);
    }
    toast.success(`${product.name} updated in cart`);
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="aspect-square skeleton rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 skeleton rounded w-3/4" />
              <div className="h-5 skeleton rounded w-1/2" />
              <div className="h-20 skeleton rounded" />
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">Product not found</h1>
            <Link href="/search" className="text-green-600 hover:underline">← Browse Products</Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          {product.category && (
            <>
              <Link href={`/category/${product.category.slug}`} className="hover:text-green-600">
                {product.category.name}
              </Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-gray-800 font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
          {/* Image */}
          <div className="relative w-full aspect-square md:aspect-[4/3] bg-[#f4f6f8] -mx-4 sm:mx-0 rounded-none sm:rounded-2xl overflow-hidden border-y sm:border border-gray-100 group flex items-center justify-center p-4 sm:p-6">
            <div className="relative w-full h-full mix-blend-multiply">
              <Image
                src={getImageUrl(product.image_url)}
                alt={product.name}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                onError={(e: any) => {
                  e.target.src = "/placeholder-product.jpg";
                }}
              />
            </div>
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <span className="bg-red-500 text-white font-bold px-6 py-2 rounded-full text-lg shadow-sm">
                  Out of Stock
                </span>
              </div>
            )}
            {product.is_featured && (
              <div className="absolute top-4 left-4">
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">
                  ⭐ Featured
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="pb-24 sm:pb-0">
            {product.category && (
              <Link
                href={`/category/${product.category.slug}`}
                className="text-sm text-green-600 font-medium hover:underline inline-block mt-4 sm:mt-0"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-1 mb-4 leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Stock */}
            <div className="mb-4">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Out of Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  In Stock
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-5xl font-black text-gray-900 tracking-tight">
                {formatCurrency(product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl font-medium text-gray-400 line-through decoration-1">
                    {formatCurrency(product.mrp!)}
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    ({discountPercent}% off)
                  </span>
                </>
              )}
              <span className="text-gray-500 text-lg font-semibold ml-2">
                / {product.unit || "Kg"}
              </span>
            </div>

            {product.description && (
              <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>
            )}

            {/* Quantity + Add to cart */}
            {!isOutOfStock && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
                {!product.is_weight_based && (
                  <div className="flex items-center justify-between border border-green-700 rounded-xl overflow-hidden bg-green-50 shadow-sm h-14 sm:w-36">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-12 h-full flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors duration-200"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="flex-1 text-center font-bold text-green-900 text-lg">{qty}</span>
                    <button
                      onClick={handleIncrease}
                      className="w-12 h-full flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors duration-200"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold h-14 px-8 rounded-xl transition-all duration-200 shadow-[0_4px_14px_0_rgb(21,128,61,0.39)] hover:shadow-[0_6px_20px_rgba(21,128,61,0.23)] hover:-translate-y-0.5 text-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.is_weight_based && cartItem ? `Edit Weight (${formatWeight(cartItem.quantity)})` : "Add to Cart"}
                </button>
              </div>
            )}

            {mounted && cartItem && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
                <span className="text-sm text-green-700 font-medium">
                  {product.is_weight_based ? formatWeight(cartItem.quantity) : cartItem.quantity} in cart
                </span>
                <Link href="/cart" className="text-sm text-green-700 font-semibold hover:underline">
                  View Cart →
                </Link>
              </div>
            )}

            {/* Weight Selector Modal */}
            {product.is_weight_based && (
              <WeightSelectorModal
                isOpen={showWeightModal}
                product={product}
                initialWeight={cartItem ? cartItem.quantity : undefined}
                onClose={() => setShowWeightModal(false)}
                onSave={handleSaveWeight}
              />
            )}

            {/* Trust Section */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 border-t border-gray-100 pt-6">
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <Zap className="w-6 h-6 text-orange-500 mb-2" />
                <span className="text-[11px] sm:text-xs font-bold text-gray-800">Superfast<br/>Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <ShieldCheck className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-[11px] sm:text-xs font-bold text-gray-800">100%<br/>Genuine</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <Award className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-[11px] sm:text-xs font-bold text-gray-800">Best<br/>Quality</span>
              </div>
            </div>

            <Link
              href={product.category ? `/category/${product.category.slug}` : "/search"}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 text-sm transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue shopping
            </Link>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 sm:mt-16 border-t border-gray-100 pt-8 sm:pt-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 tracking-tight">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Add to Cart Footer */}
      {!isOutOfStock && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] pb-safe flex items-center gap-3">
          <div className="flex items-center justify-between border border-green-700 rounded-xl overflow-hidden bg-green-50 shadow-sm h-14 w-32">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-10 h-full flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="flex-1 text-center font-bold text-green-900 text-base">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-10 h-full flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold h-14 rounded-xl shadow-[0_4px_12px_rgba(21,128,61,0.3)] text-lg"
          >
            <ShoppingCart className="w-5 h-5" />
            Add • {formatCurrency(product.price * qty)}
          </button>
        </div>
      )}
    </CustomerLayout>
  );
}
