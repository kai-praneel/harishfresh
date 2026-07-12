"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, Tag, List, ShoppingBag,
  Settings, LogOut, Leaf, Menu, X, Bell
} from "lucide-react";
import { useAdminStore } from "@/store/adminStore";
import { ordersApi } from "@/services/api";
import { cn } from "@/utils";
import toast from "react-hot-toast";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/subcategories", label: "Subcategories", icon: List },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, username } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrders, setNewOrders] = useState(0);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const [mounted, setMounted] = useState(false);
  const prevOut = useRef<Set<string>>(new Set());
  const prevLow = useRef<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth guard
  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace("/admin/login");
  }, [isAuthenticated, mounted, router]);

  // Notification polling
  useEffect(() => {
    if (!isAuthenticated) return;
    let prev = 0;
    let prevCancelled = -1;
    const poll = async () => {
      try {
        const res = await ordersApi.poll();
        const { new_orders, cancelled_orders, out_of_stock = [], low_stock = [] } = res.data;
        
        if (new_orders > prev && prev >= 0) {
          playNotificationSound();
          toast.success(`New order received!`, { icon: '🛍️' });
        }
        
        if (cancelled_orders > prevCancelled && prevCancelled >= 0) {
          playNotificationSound();
          toast.error(`An order was cancelled!`, { icon: '❌' });
        }
        
        prev = new_orders;
        prevCancelled = cancelled_orders;
        setNewOrders(new_orders);
        
        // Handle inventory notifications
        const currentOut = new Set<string>(out_of_stock);
        const currentLow = new Set<string>(low_stock);
        
        currentOut.forEach(name => {
           if (!prevOut.current.has(name)) {
             toast.error(`${name} is Out of Stock!`, { icon: '⚠️' });
           }
        });
        
        currentLow.forEach(name => {
           if (!prevLow.current.has(name)) {
             toast.error(`${name} is Low on Stock`, { icon: '📉' });
           }
        });
        
        prevOut.current = currentOut;
        prevLow.current = currentLow;
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  if (!mounted) return null;
  if (!isAuthenticated) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-display font-bold text-green-800 text-base">HarishFresh</span>
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {label === "Orders" && newOrders > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full badge-pulse">
                  {newOrders}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">{username}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {newOrders > 0 && (
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {newOrders} new order{newOrders > 1 ? "s" : ""}
            </Link>
          )}
          <Link
            href="/"
            target="_blank"
            className="text-xs text-gray-500 hover:text-green-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            View Store ↗
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
