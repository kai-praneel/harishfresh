"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils";
import { getImageUrl } from "@/services/api";
import toast from "react-hot-toast";
import WeightSelectorModal from "./WeightSelectorModal";
import { formatWeight } from "@/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const addItemWithQty = useCartStore((s) => s.addItemWithQty);
  const updateQty = useCartStore((s) => s.updateQty);
  const cartItems = useCartStore((s) => s.items);
  const increaseQty = useCartStore((s) => s.increaseQty);
  const decreaseQty = useCartStore((s) => s.decreaseQty);
  
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItem = cartItems.find((i) => i.product.id === product.id);
  const isOutOfStock = product.stock_status === "out_of_stock" || 
    (product.is_weight_based && product.available_stock !== null && product.available_stock !== undefined && product.available_stock <= 0);
  
  const hasDiscount = product.mrp && product.mrp > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) 
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    
    if (product.is_weight_based) {
      setShowWeightModal(true);
      return;
    }
    
    const currentQty = cartItem ? cartItem.quantity : 0;
    if (product.available_stock !== null && product.available_stock !== undefined && currentQty >= product.available_stock) {
      return;
    }
    
    addItem(product);
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleSaveWeight = (grams: number) => {
    if (cartItem) {
      updateQty(product.id, grams);
    } else {
      addItemWithQty(product, grams);
    }
    setAdded(true);
    toast.success(`${product.name} updated in cart`);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
      <Link href={`/product/${product.id}`} className="block h-full">
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-green-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 group h-full flex flex-col relative">
        
        {/* Image Container */}
        <div className="aspect-[4/3] relative bg-[#f4f6f8] group-hover:bg-[#f0fdf4] transition-colors duration-300">
          {hasDiscount && (
            <div className="absolute top-2 left-2 z-20 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm shadow-sm">
              {discountPercent}% OFF
            </div>
          )}
          <Image
            src={getImageUrl(product.image_url)}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out mix-blend-multiply"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            onError={(e: any) => {
              e.target.src = "/placeholder-product.jpg";
            }}
          />
          
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="bg-gray-900 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-md shadow-lg">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col flex-1 border-t border-gray-50/50">
          {product.is_featured && !isOutOfStock && (
            <span className="inline-block bg-orange-100 text-orange-700 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded flex-shrink-0 w-max mb-2">
              Top Pick
            </span>
          )}

          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors duration-200 mb-1">
            {product.name}
          </h3>
          
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-auto mb-3">
            {product.unit || "1 pc"}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col justify-end h-[36px]">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-price text-lg text-gray-900 tracking-tight leading-none">
                  {formatCurrency(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-[11px] font-medium text-gray-400 line-through decoration-1">
                    {formatCurrency(product.mrp!)}
                  </span>
                )}
              </div>
            </div>

            {/* ADD Button */}
            <div className="relative z-20 shrink-0 ml-2">
              {mounted && cartItem ? (
                product.is_weight_based ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowWeightModal(true);
                    }}
                    className="flex items-center justify-center bg-green-700 text-white rounded-xl overflow-hidden h-[36px] w-[90px] shadow-sm text-xs font-bold hover:bg-green-800 transition-colors"
                  >
                    {formatWeight(cartItem.quantity, product.unit)}
                  </button>
                ) : (
                  <div
                    className="flex items-center justify-between bg-green-700 rounded-xl overflow-hidden h-[36px] w-[76px] shadow-sm"
                    onClick={(e) => e.preventDefault()}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        decreaseQty(product.id);
                      }}
                      className="w-1/3 h-full flex items-center justify-center text-white hover:bg-green-800 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-1/3 text-center text-xs font-bold text-white">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (product.available_stock !== null && product.available_stock !== undefined && cartItem.quantity >= product.available_stock) {
                          return;
                        }
                        increaseQty(product.id);
                      }}
                      disabled={product.available_stock !== null && product.available_stock !== undefined && cartItem.quantity >= product.available_stock}
                      className={`w-1/3 h-full flex items-center justify-center transition-colors ${
                        product.available_stock !== null && product.available_stock !== undefined && cartItem.quantity >= product.available_stock
                          ? "text-green-900/30 cursor-not-allowed bg-green-700"
                          : "text-white hover:bg-green-800"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex items-center justify-center text-sm font-extrabold tracking-wide w-[76px] h-[36px] rounded-xl transition-all duration-200 ${
                    isOutOfStock
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed hidden"
                      : added
                      ? "bg-green-700 text-white shadow-md shadow-green-700/20"
                      : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-700 hover:text-white hover:border-green-700 hover:shadow-md hover:shadow-green-700/20"
                  }`}
                >
                  {added ? <CheckCircle className="w-4 h-4" /> : "ADD"}
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </Link>
      <WeightSelectorModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        product={product}
        initialWeight={cartItem?.quantity || 0}
        onSave={handleSaveWeight}
      />
    </>
  );
}
