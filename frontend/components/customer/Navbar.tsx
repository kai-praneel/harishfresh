"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X, Search } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { cn } from "@/utils";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems());

  useEffect(() => {
    setMounted(true);
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/categories", label: "Categories" },
    { href: "/search", label: "Products" },
    { href: "/track", label: "Track Order" },
    { href: "/#contact", label: "Contact Us" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-b border-gray-100"
          : "bg-white/50 backdrop-blur-md border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px] transition-all duration-300">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo.png"
              alt="HarishFresh Logo"
              className="w-10 h-10 object-contain rounded-xl group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
            />
            <div className="flex flex-col">
              <span className="font-display text-xl font-black text-green-700 leading-none tracking-tight">
                Harish
              </span>
              <span className="font-display text-xl font-black text-orange-500 leading-none tracking-tight">
                Fresh
              </span>
            </div>
          </Link>

          {/* Desktop Search Pill & Nav */}
          <div className="hidden md:flex flex-1 items-center justify-center px-6">
            {pathname !== "/search" && (
              <Link 
                href="/search"
                className="flex items-center gap-3 bg-gray-50 hover:bg-white text-gray-500 w-full max-w-md px-5 py-2.5 rounded-2xl transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md hover:border-green-300 mr-6"
              >
                <Search className="w-5 h-5 text-green-700" />
                <span className="text-[14px] font-medium text-gray-500 truncate">Search for "tomatoes"...</span>
              </Link>
            )}
            <div className="flex items-center gap-6">
              <Link href="/track" className="text-sm font-bold text-gray-600 hover:text-green-700 transition-colors">
                Track Order
              </Link>
              <Link href="/#contact" className="text-sm font-bold text-gray-600 hover:text-green-700 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 shrink-0">
            {pathname !== "/search" && (
              <Link
                href="/search"
                className="md:hidden p-2.5 bg-gray-50 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-colors duration-200 border border-gray-200 shadow-sm"
              >
                <Search className="w-5 h-5" />
              </Link>
            )}
            
            <Link
              href="/cart"
              className="flex items-center gap-2.5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full transition-all duration-200 shadow-[0_4px_12px_rgba(22,163,74,0.25)] hover:shadow-[0_6px_16px_rgba(22,163,74,0.35)] hover:-translate-y-0.5"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-green-600">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-bold">Cart</span>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2.5 text-gray-600 hover:text-green-700 hover:bg-green-50/80 rounded-full transition-colors duration-200 ml-1"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar (Below Nav) */}
        {pathname !== "/search" && (
          <div className="md:hidden pb-3">
            <Link 
              href="/search"
              className="flex items-center gap-3 bg-gray-50 hover:bg-white text-gray-500 w-full px-4 py-3 rounded-xl transition-all duration-200 border border-gray-200 shadow-sm"
            >
              <Search className="w-5 h-5 text-green-700" />
              <span className="text-sm font-medium">Search for groceries...</span>
            </Link>
          </div>
        )}

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 py-4 px-2 absolute left-0 right-0 shadow-lg animate-slide-up">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block px-4 py-3 text-sm font-bold rounded-xl mb-2 transition-all",
                  pathname === l.href
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
