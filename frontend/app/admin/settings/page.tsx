"use client";

import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon, Save, Loader2, Phone, MapPin, Store,
  DollarSign, MessageSquare, Truck,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { settingsApi } from "@/services/api";
import { Settings } from "@/types";
import toast from "react-hot-toast";
import MapPicker from "@/components/shared/MapPicker";

interface FormData {
  whatsapp_number: string;
  minimum_order_amount: string;
  store_name: string;
  store_address: string;
  gmaps_link: string;
  store_latitude: number | null;
  store_longitude: number | null;
  delivery_charges_enabled: boolean;
  max_delivery_radius_km: string;
  free_delivery_radius_km: string;
  delivery_charge_model: "none" | "flat" | "per_km";
  flat_delivery_fee: string;
  delivery_charge_per_km: string;
  handling_charge: string;
  free_delivery_message: string;
  bulk_order_message: string;
}

const EMPTY_FORM: FormData = {
  whatsapp_number: "",
  minimum_order_amount: "",
  store_name: "",
  store_address: "",
  gmaps_link: "",
  store_latitude: null,
  store_longitude: null,
  delivery_charges_enabled: false,
  max_delivery_radius_km: "15",
  free_delivery_radius_km: "5",
  delivery_charge_model: "none",
  flat_delivery_fee: "0",
  delivery_charge_per_km: "10",
  handling_charge: "0",
  free_delivery_message: "",
  bulk_order_message: "",
};

export default function SettingsPage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<string>("");

  const fetchSettings = async () => {
    try {
      const res = await settingsApi.get();
      const s: Settings = res.data;
      setForm({
        whatsapp_number: s.whatsapp_number || "",
        minimum_order_amount: String(s.minimum_order_amount || ""),
        store_name: s.store_name || "",
        store_address: s.store_address || "",
        gmaps_link: s.gmaps_link || "",
        store_latitude: s.store_latitude ?? null,
        store_longitude: s.store_longitude ?? null,
        delivery_charges_enabled: s.delivery_charges_enabled ?? false,
        max_delivery_radius_km: String(s.max_delivery_radius_km ?? "15"),
        free_delivery_radius_km: String(s.free_delivery_radius_km ?? "5"),
        delivery_charge_model: s.delivery_charge_model || "none",
        flat_delivery_fee: String(s.flat_delivery_fee ?? "0"),
        delivery_charge_per_km: String(s.delivery_charge_per_km ?? "10"),
        handling_charge: String(s.handling_charge ?? "0"),
        free_delivery_message: s.free_delivery_message || "",
        bulk_order_message: s.bulk_order_message || "",
      });
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.whatsapp_number.trim())
      e.whatsapp_number = "WhatsApp number is required";
    else if (!/^\d{10,15}$/.test(form.whatsapp_number.replace(/[+\s-]/g, "")))
      e.whatsapp_number = "Enter a valid phone number (10-15 digits)";
    if (
      !form.minimum_order_amount ||
      isNaN(Number(form.minimum_order_amount)) ||
      Number(form.minimum_order_amount) <= 0
    )
      e.minimum_order_amount = "Enter a valid minimum order amount";
    if (!form.store_name.trim()) e.store_name = "Store name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        whatsapp_number: form.whatsapp_number.trim(),
        minimum_order_amount: Number(form.minimum_order_amount),
        store_name: form.store_name.trim(),
        store_address: form.store_address.trim(),
        gmaps_link: form.gmaps_link.trim(),
        store_latitude: form.store_latitude,
        store_longitude: form.store_longitude,
        delivery_charges_enabled: form.delivery_charges_enabled,
        max_delivery_radius_km: Number(form.max_delivery_radius_km),
        free_delivery_radius_km: Number(form.free_delivery_radius_km),
        delivery_charge_model: form.delivery_charge_model,
        flat_delivery_fee: Number(form.flat_delivery_fee),
        delivery_charge_per_km: Number(form.delivery_charge_per_km),
        handling_charge: Number(form.handling_charge),
        free_delivery_message: form.free_delivery_message.trim(),
        bulk_order_message: form.bulk_order_message.trim(),
      };
      await settingsApi.update(payload);
      toast.success("Settings saved successfully");
      setLastSaved(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-10 skeleton rounded w-1/3" />
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 skeleton rounded w-1/4" />
                <div className="h-10 skeleton rounded-xl w-full" />
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Configure store settings and contact information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-600" />
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  WhatsApp Number *
                </label>
                <input
                  type="text"
                  value={form.whatsapp_number}
                  onChange={(e) =>
                    updateField("whatsapp_number", e.target.value)
                  }
                  placeholder="e.g., 919876543210"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.whatsapp_number
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                    }`}
                />
                {errors.whatsapp_number ? (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.whatsapp_number}
                  </p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">
                    Include country code without + (e.g., 919876543210)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Store Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Store className="w-4 h-4 text-green-600" />
              Store Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={form.store_name}
                  onChange={(e) => updateField("store_name", e.target.value)}
                  placeholder="e.g., HarishFresh"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.store_name
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                    }`}
                />
                {errors.store_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.store_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Store Address
                </label>
                <textarea
                  value={form.store_address}
                  onChange={(e) =>
                    updateField("store_address", e.target.value)
                  }
                  placeholder="Enter store address"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none mb-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Google Maps Share Link
                </label>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={form.gmaps_link}
                    onChange={(e) => updateField("gmaps_link", e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!form.gmaps_link.trim()) {
                        toast.error("Please enter a Google Maps link first");
                        return;
                      }
                      const id = toast.loading("Extracting location...");
                      try {
                        const res = await settingsApi.extractLocation(form.gmaps_link.trim());
                        const data = res.data;
                        
                        setForm(f => ({
                          ...f,
                          store_latitude: data.latitude,
                          store_longitude: data.longitude
                        }));
                        toast.success("Location extracted successfully", { id });
                      } catch (err: any) {
                        toast.error(err.response?.data?.detail || err.message || "Failed to extract location", { id });
                      }
                    }}
                    className="px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    Extract Location
                  </button>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Store Location
                </label>
                <div className="h-[300px] rounded-xl overflow-hidden border border-gray-200 relative z-0">
                  <MapPicker
                    position={form.store_latitude && form.store_longitude ? { lat: form.store_latitude, lng: form.store_longitude } : null}
                    onChange={(pos) => {
                      setForm(f => ({ ...f, store_latitude: pos.lat, store_longitude: pos.lng }));
                    }}
                  />
                </div>
                <p className="text-gray-400 text-xs mt-2">Extract from a Google Maps link, or manually adjust the marker by clicking on the map.</p>
              </div>
            </div>
          </div>

          {/* Order Settings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Order Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Minimum Order Amount (₹) *
                </label>
                <input
                  type="number"
                  value={form.minimum_order_amount}
                  onChange={(e) =>
                    updateField("minimum_order_amount", e.target.value)
                  }
                  placeholder="e.g., 200"
                  min="0"
                  step="1"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.minimum_order_amount
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                    }`}
                />
                {errors.minimum_order_amount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.minimum_order_amount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Handling Charge (₹)
                </label>
                <input
                  type="number"
                  value={form.handling_charge}
                  onChange={(e) => updateField("handling_charge", e.target.value)}
                  placeholder="e.g., 10"
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
          </div>

          {/* Delivery Configuration */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-green-600" />
              Delivery Configuration
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">Enable Delivery Charges</h3>
                  <p className="text-xs text-gray-500 mt-1">If disabled, delivery is completely free.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.delivery_charges_enabled}
                    onChange={(e) => setForm(f => ({ ...f, delivery_charges_enabled: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Free Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    value={form.free_delivery_radius_km}
                    onChange={(e) => updateField("free_delivery_radius_km", e.target.value)}
                    placeholder="e.g., 5"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Max Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    value={form.max_delivery_radius_km}
                    onChange={(e) => updateField("max_delivery_radius_km", e.target.value)}
                    placeholder="e.g., 15"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>

              {form.delivery_charges_enabled && (
                <div className="p-4 border border-gray-100 rounded-xl space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Delivery Charge Model
                    </label>
                    <select
                      value={form.delivery_charge_model}
                      onChange={(e) => updateField("delivery_charge_model", e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                    >
                      <option value="none">No Charge</option>
                      <option value="flat">Flat Fee</option>
                      <option value="per_km">Per KM Fee</option>
                    </select>
                  </div>

                  {form.delivery_charge_model === "flat" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Flat Delivery Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={form.flat_delivery_fee}
                        onChange={(e) => updateField("flat_delivery_fee", e.target.value)}
                        placeholder="e.g., 50"
                        min="0"
                        step="1"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  )}

                  {form.delivery_charge_model === "per_km" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Delivery Charge Per KM (₹)
                      </label>
                      <input
                        type="number"
                        value={form.delivery_charge_per_km}
                        onChange={(e) => updateField("delivery_charge_per_km", e.target.value)}
                        placeholder="e.g., 10"
                        min="0"
                        step="1"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <p className="text-gray-400 text-xs mt-1">Applied to distance beyond the free delivery radius.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-600" />
              Display Messages
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                    Free Delivery Message
                  </span>
                </label>
                <input
                  type="text"
                  value={form.free_delivery_message}
                  onChange={(e) =>
                    updateField("free_delivery_message", e.target.value)
                  }
                  placeholder="e.g., Free delivery within 5km"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bulk Order Message
                </label>
                <input
                  type="text"
                  value={form.bulk_order_message}
                  onChange={(e) =>
                    updateField("bulk_order_message", e.target.value)
                  }
                  placeholder="e.g., For bulk orders, contact us on WhatsApp"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 pb-4">
            {lastSaved && (
              <p className="text-xs text-gray-400 order-2 sm:order-1 text-center sm:text-left">
                Last saved at {lastSaved}
              </p>
            )}
            <div className={lastSaved ? "" : "sm:ml-auto"}>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm order-1 sm:order-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
