"use client";

import Link from "next/link";
import Image from "next/image";
import { Truck, Package, MessageCircle, Leaf, Clock, ShieldCheck, Star, ArrowRight } from "lucide-react";
import { Category, Product, Settings } from "@/types";
import ProductCard from "./ProductCard";
import { extractRadius } from "@/utils";
import { getImageUrl } from "@/services/api";

// ── Free Delivery Section ──────────────────────────────────────────────────────

export function FreeDeliverySection({ message }: { message?: string }) {
  const radius = extractRadius(message);
  return (
    <section className="bg-gradient-to-r from-green-600 to-green-700 py-5">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-3 text-white">
          <Truck className="w-6 h-6 animate-bounce-soft" />
          <span className="text-base sm:text-lg font-semibold">
            🚚 {message || `Free Delivery Within ${radius}`}
          </span>
          <Truck className="w-6 h-6 animate-bounce-soft" />
        </div>
        <p className="text-green-200 text-xs mt-1">
          Additional charges may apply beyond {radius}
        </p>
      </div>
    </section>
  );
}

// ── Categories Section ─────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  vegetables: "🥦",
  fruits: "🍎",
  "dry-fruits": "🫘",
  millets: "🌾",
};

const CATEGORY_COLORS: Record<string, string> = {
  vegetables: "bg-green-50",
  fruits: "bg-red-50",
  "dry-fruits": "bg-amber-50",
  millets: "bg-yellow-50",
};

export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-2 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg sm:text-xl font-black text-gray-900 tracking-tight">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const icon = CATEGORY_ICONS[cat.slug] || "🧺";
            const color = CATEGORY_COLORS[cat.slug] || "bg-green-50";
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group flex flex-col items-center cursor-pointer transition-all duration-200"
              >
                <div className={`relative w-14 h-14 sm:w-16 sm:h-16 mb-2 rounded-2xl ${color} flex items-center justify-center border border-gray-100 group-hover:border-green-200 group-hover:shadow-sm transition-all duration-300 overflow-hidden`}>
                  {cat.image_url ? (
                    <Image
                      src={getImageUrl(cat.image_url)}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 56px, 64px"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300 z-10">{icon}</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-800 text-xs sm:text-sm text-center leading-tight group-hover:text-green-700 transition-colors duration-200 line-clamp-2 px-1">
                  {cat.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Featured Products Section ──────────────────────────────────────────────────

export function FeaturedProductsSection({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;
  return (
    <section className="py-2 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              Featured Products
            </h2>
          </div>
          <Link
            href="/search"
            className="hidden sm:inline-flex items-center gap-1.5 text-green-700 hover:text-green-800 font-bold text-sm bg-white hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors duration-200 shadow-sm border border-gray-100"
          >
            See All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.slice(0, 10).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="sm:hidden text-center mt-6">
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 bg-white text-green-700 font-bold w-full py-3.5 rounded-xl border border-gray-200 shadow-sm"
          >
            See All Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Bulk Orders Section ────────────────────────────────────────────────────────

export function BulkOrdersSection({ settings }: { settings?: Settings | null }) {
  const waUrl = `https://wa.me/${settings?.whatsapp_number || "917396896009"}?text=${encodeURIComponent(settings?.bulk_order_message || "Hi, I want to place a bulk order.")}`;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#064e3b] to-[#14532d] rounded-[2rem] p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-green-400 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500 blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
              <Package className="w-10 h-10 text-green-300" />
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Bulk Orders Accepted
            </h2>
            <p className="text-green-100/90 text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Need vegetables, fruits, dry fruits, or millets in bulk? Contact us directly on
              WhatsApp for special pricing and bulk discounts.
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-[#064e3b] font-bold px-8 py-4 rounded-full hover:bg-green-50 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] duration-200 text-lg"
            >
              <MessageCircle className="w-6 h-6" />
              Contact on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Why Choose Section ────────────────────────────────────────────────────────

const WHY_ITEMS = [
  {
    icon: Leaf,
    title: "Farm Fresh",
    desc: "Sourced directly from farms daily for guaranteed freshness",
    color: "green",
  },
  {
    icon: Truck,
    title: "Free Delivery",
    desc: "Free delivery within 5km radius of our store",
    color: "blue",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assured",
    desc: "Every product is inspected before delivery",
    color: "purple",
  },
  {
    icon: Clock,
    title: "Quick Delivery",
    desc: "Same day delivery for orders placed before noon",
    color: "orange",
  },
  {
    icon: Package,
    title: "Bulk Orders",
    desc: "Special pricing for bulk and wholesale orders",
    color: "amber",
  },
  {
    icon: Star,
    title: "Best Prices",
    desc: "Competitive prices with no compromise on quality",
    color: "yellow",
  },
];

const colorMap: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  amber: "bg-amber-100 text-amber-700",
  yellow: "bg-yellow-100 text-yellow-700",
};

export function WhyChooseSection({ settings }: { settings?: Settings | null }) {
  const radius = extractRadius(settings?.free_delivery_message);

  const dynamicWhyItems = WHY_ITEMS.map(item => {
    if (item.title === "Free Delivery") {
      return { ...item, desc: `Free delivery within ${radius} radius of our store` };
    }
    return item;
  });

  return (
    <section className="py-16 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Why Choose HarishFresh?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto font-medium">
            We deliver more than just groceries — we deliver quality, trust, and freshness
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {dynamicWhyItems.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-[1.5rem] p-6 sm:p-8 text-center hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-gray-100">
              <div className={`w-14 h-14 mx-auto mb-5 rounded-full ${colorMap[color]} flex items-center justify-center shadow-inner`}>
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── WhatsApp CTA Section ──────────────────────────────────────────────────────

export function WhatsAppCTA({ settings }: { settings?: Settings | null }) {
  const waUrl = `https://wa.me/${settings?.whatsapp_number || "917396896009"}`;

  return (
    <section className="py-12 bg-white" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-green-50 rounded-2xl p-8 border border-green-100">
          <div>
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-1">
              {settings?.store_name || "HarishFresh"}
            </h3>
            {settings?.store_address && (
              <p className="text-gray-500 text-sm mb-1">
                📍 {settings.store_address}
                <a
                  href={
                    settings?.gmaps_link || (settings?.store_latitude && settings?.store_longitude
                      ? `https://www.google.com/maps/search/?api=1&query=${settings.store_latitude},${settings.store_longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.store_address)}`)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 hover:underline font-semibold ml-2 text-xs inline-flex items-center gap-0.5"
                >
                  (Open in Google Maps)
                </a>
              </p>
            )}
            {settings?.whatsapp_number && (
              <p className="text-gray-500 text-sm">📞 +{settings.whatsapp_number}</p>
            )}
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-md"
          >
            <MessageCircle className="w-5 h-5" />
            Contact on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

export default { FreeDeliverySection, CategoriesSection, FeaturedProductsSection, BulkOrdersSection, WhyChooseSection, WhatsAppCTA };
