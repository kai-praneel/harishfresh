"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingBag, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { ordersApi } from "@/services/api";
import { DashboardStats } from "@/types";
import { formatCurrency } from "@/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.stats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Total Products", value: stats.total_products, icon: Package, color: "blue", href: "/admin/products" },
        { label: "Total Orders", value: stats.total_orders, icon: ShoppingBag, color: "green", href: "/admin/orders" },
        { label: "New Orders", value: stats.new_orders, icon: Clock, color: "orange", href: "/admin/orders?status=new" },
        { label: "Delivered", value: stats.delivered_orders, icon: CheckCircle, color: "emerald", href: "/admin/orders?status=delivered" },
      ]
    : [];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back to HarishFresh admin</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="h-10 w-10 skeleton rounded-xl mb-3" />
              <div className="h-8 skeleton rounded w-16 mb-2" />
              <div className="h-4 skeleton rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map(({ label, value, icon: Icon, color, href }) => (
            <Link
              key={label}
              href={href}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
              <p className="text-sm text-gray-500 group-hover:text-green-600 transition-colors">{label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Order status breakdown */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Status Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: "New", count: stats.new_orders, color: "bg-blue-500", total: stats.total_orders },
                { label: "Confirmed", count: stats.confirmed_orders, color: "bg-yellow-500", total: stats.total_orders },
                { label: "Delivered", count: stats.delivered_orders, color: "bg-green-500", total: stats.total_orders },
                { label: "Cancelled", count: stats.cancelled_orders, color: "bg-red-500", total: stats.total_orders },
              ].map(({ label, count, color, total }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-800">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { href: "/admin/products", label: "Add New Product", icon: Package, desc: "Add a product to your store" },
                { href: "/admin/orders?status=new", label: "View New Orders", icon: Clock, desc: `${stats?.new_orders || 0} orders waiting` },
                { href: "/admin/categories", label: "Manage Categories", icon: TrendingUp, desc: "Add or edit categories" },
              ].map(({ href, label, icon: Icon, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-50 text-green-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-green-700 transition-colors">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
