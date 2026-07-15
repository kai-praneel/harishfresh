"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, X, Package, Search, Loader2, Star, ImageIcon, Upload } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { productsApi, categoriesApi, subcategoriesApi, getImageUrl } from "@/services/api";
import { Product, Category, Subcategory } from "@/types";
import { formatCurrency, formatWeight } from "@/utils";
import toast from "react-hot-toast";
import { revalidateProducts } from "@/app/actions/revalidate";

interface FormState {
  name: string; description: string; price: string; mrp: string; stock_status: string;
  is_featured: boolean; category_id: string; subcategory_id: string;
  unit_type: string; custom_unit: string;
  is_weight_based: boolean; available_stock: string; low_stock_threshold: string; is_active: boolean;
}
const EMPTY: FormState = { 
  name: "", description: "", price: "", mrp: "", stock_status: "in_stock", is_featured: false, 
  category_id: "", subcategory_id: "", unit_type: "Kg", custom_unit: "", 
  is_weight_based: false, available_stock: "", low_stock_threshold: "", is_active: true 
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        productsApi.list(), categoriesApi.list(), subcategoriesApi.list(),
      ]);
      setProducts(pRes.data); setCategories(cRes.data); setSubcategories(sRes.data);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const filteredSubs = subcategories.filter((s) => form.category_id && s.category_id === Number(form.category_id));
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setImageFile(null); setImagePreview(""); setErrors({}); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditingId(p.id);
    const options = ["Kg", "Gram", "Piece", "Dozen", "Packet", "Box", "Bottle", "Bundle", "250g", "500g"];
    const isCustom = p.unit && !options.includes(p.unit);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      mrp: p.mrp ? String(p.mrp) : "",
      stock_status: p.stock_status,
      is_featured: p.is_featured,
      category_id: String(p.category_id),
      subcategory_id: p.subcategory_id ? String(p.subcategory_id) : "",
      unit_type: isCustom ? "Custom" : (p.unit || "Kg"),
      custom_unit: isCustom ? p.unit : "",
      is_weight_based: p.is_weight_based || false,
      available_stock: p.available_stock !== null ? (p.is_weight_based ? String(p.available_stock / 1000) : String(p.available_stock)) : "",
      low_stock_threshold: p.low_stock_threshold !== null ? (p.is_weight_based ? String(p.low_stock_threshold / 1000) : String(p.low_stock_threshold)) : "",
      is_active: p.is_active !== undefined ? p.is_active : true,
    });
    setImageFile(null); setImagePreview(p.image_url ? getImageUrl(p.image_url) : ""); setErrors({}); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY); setImageFile(null); setImagePreview(""); setErrors({}); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) { toast.error("Only JPG, PNG, WebP allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max file size is 5MB"); return; }
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Product name required (min 2 chars)";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Valid price required";
    if (!form.category_id) e.category_id = "Category required";
    if (form.unit_type === "Custom" && !form.custom_unit.trim()) {
      e.custom_unit = "Custom unit is required";
    }
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault(); if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("price", form.price);
      if (form.mrp && Number(form.mrp) > 0) fd.append("mrp", form.mrp);
      else fd.append("mrp", "");
      fd.append("stock_status", form.stock_status);
      fd.append("is_featured", String(form.is_featured));
      fd.append("is_weight_based", String(form.is_weight_based));
      if (form.available_stock.trim() !== "") {
        fd.append("available_stock", form.is_weight_based ? String(Math.round(parseFloat(form.available_stock) * 1000)) : form.available_stock);
      }
      if (form.low_stock_threshold.trim() !== "") {
        fd.append("low_stock_threshold", form.is_weight_based ? String(Math.round(parseFloat(form.low_stock_threshold) * 1000)) : form.low_stock_threshold);
      }
      fd.append("is_active", String(form.is_active));
      const unitVal = form.unit_type === "Custom" ? form.custom_unit.trim() : form.unit_type;
      fd.append("unit", unitVal || "Kg");
      fd.append("category_id", form.category_id);
      if (form.subcategory_id) fd.append("subcategory_id", form.subcategory_id);
      if (imageFile) fd.append("image", imageFile);

      if (editingId) { await productsApi.update(editingId, fd); toast.success("Product updated"); }
      else { await productsApi.create(fd); toast.success("Product created"); }
      await revalidateProducts();
      closeForm(); await fetchData();
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Failed to save product"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { await productsApi.delete(deleteTarget.id); toast.success("Product deleted"); setDeleteTarget(null); await revalidateProducts(); await fetchData(); }
    catch (err: any) { toast.error(err?.response?.data?.detail || "Failed to delete"); }
    finally { setDeleting(false); }
  };

  const toggleStock = async (p: Product) => {
    try {
      const fd = new FormData();
      fd.append("stock_status", p.stock_status === "in_stock" ? "out_of_stock" : "in_stock");
      await productsApi.update(p.id, fd); toast.success("Stock status updated"); await revalidateProducts(); await fetchData();
    } catch { toast.error("Failed to update stock status"); }
  };

  const toggleFeatured = async (p: Product) => {
    try {
      const fd = new FormData();
      fd.append("is_featured", String(!p.is_featured));
      await productsApi.update(p.id, fd); toast.success("Featured status updated"); await revalidateProducts(); await fetchData();
    } catch { toast.error("Failed to update featured status"); }
  };

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-500 mt-1 text-sm">{products.length} total products</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="mb-6"><div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
      </div></div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => (<div key={i} className="bg-white rounded-xl border border-gray-100 p-4"><div className="h-32 skeleton rounded-lg mb-3" /><div className="h-4 skeleton rounded w-2/3 mb-2" /><div className="h-3 skeleton rounded w-1/3" /></div>))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">{search ? "No products match your search" : "No products yet"}</h3>
          <p className="text-gray-400 text-sm mb-4">{search ? "Try a different search term" : "Create your first product"}</p>
          {!search && <button onClick={openCreate} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"><Plus className="w-4 h-4" /> Add Product</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const isWeightOOS = p.is_weight_based && p.available_stock !== null && p.available_stock !== undefined && p.available_stock <= 0;
            const isLowStock = p.is_weight_based && p.stock_status === "in_stock" && p.available_stock !== null && p.low_stock_threshold !== null && p.available_stock > 0 && p.available_stock <= p.low_stock_threshold;
            const effectiveOOS = p.stock_status === "out_of_stock" || isWeightOOS;

            return (
            <div key={p.id} className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow group ${effectiveOOS ? "border-red-200" : isLowStock ? "border-orange-200" : "border-gray-100"}`}>
              <div className="relative h-40 bg-gray-50">
                {p.image_url ? (
                  <img src={getImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).classList.add("hidden"); }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-200" /></div>
                )}
                <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end max-w-[75%]">
                  {p.is_featured && <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" /> Featured</span>}
                  {!p.is_active && <span className="bg-gray-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">Inactive</span>}
                  {p.is_weight_based && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">Weight</span>}
                </div>
                <div className="absolute top-2 left-2">
                  {effectiveOOS ? (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">Out of Stock</span>
                  ) : isLowStock ? (
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">Low Stock</span>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">In Stock</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-sm truncate">{p.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex flex-col">
                    {p.mrp && p.mrp > p.price && (
                      <span className="text-[10px] text-gray-400 line-through">
                        {formatCurrency(p.mrp)}
                      </span>
                    )}
                    <span className="text-green-700 font-bold text-base">
                      {formatCurrency(p.price)} / {p.unit || "Kg"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">• {catMap.get(p.category_id) || "—"}</span>
                </div>
                {/* Admin Inventory Info */}
                {p.is_weight_based && (
                  <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium ${effectiveOOS ? "bg-red-50 text-red-700" : isLowStock ? "bg-orange-50 text-orange-700" : "bg-gray-50 text-gray-600"}`}>
                    <div className="flex justify-between">
                      <span>Current Stock:</span>
                      <span className="font-bold">{p.available_stock !== null && p.available_stock !== undefined ? formatWeight(p.available_stock, p.unit) : "Not set"}</span>
                    </div>
                    {p.low_stock_threshold !== null && p.low_stock_threshold !== undefined && (
                      <div className="flex justify-between mt-0.5">
                        <span>Low Stock Alert:</span>
                        <span>{formatWeight(p.low_stock_threshold, p.unit)}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                  <button onClick={() => toggleFeatured(p)} className={`p-1.5 rounded-lg text-xs transition-colors ${p.is_featured ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" : "text-gray-400 hover:bg-gray-100 hover:text-yellow-600"}`} title="Toggle featured"><Star className="w-3.5 h-3.5" /></button>
                  <button onClick={() => toggleStock(p)} className={`px-2 py-1 rounded-lg text-xs transition-colors ${p.stock_status === "in_stock" ? "text-green-600 hover:bg-green-50" : "text-red-600 hover:bg-red-50"}`} title="Toggle stock">{p.stock_status === "in_stock" ? "In Stock" : "Out"}</button>
                  <div className="flex-1" />
                  <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40" onClick={closeForm} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? "Edit Product" : "Add Product"}</h2>
              <button onClick={closeForm} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Fresh Tomatoes" className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.name ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {`Price per ${form.unit_type === "Custom" ? (form.custom_unit || "Unit") : form.unit_type} (₹) *`}
                  </label>
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0" min="0" step="0.01" className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.price ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">MRP (Optional)</label>
                  <input type="number" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} placeholder="0" min="0" step="0.01" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Measurement Unit *</label>
                  <select value={form.unit_type} onChange={(e) => setForm((f) => ({ ...f, unit_type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                    <option value="Kg">Kg</option>
                    <option value="Gram">Gram</option>
                    <option value="Piece">Piece</option>
                    <option value="Dozen">Dozen</option>
                    <option value="Packet">Packet</option>
                    <option value="Box">Box</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Bundle">Bundle</option>
                    <option value="250g">250g</option>
                    <option value="500g">500g</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                {form.unit_type === "Custom" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Unit *</label>
                    <input type="text" value={form.custom_unit} onChange={(e) => setForm((f) => ({ ...f, custom_unit: e.target.value }))} placeholder="e.g. bunch, 100g" className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.custom_unit ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
                    {errors.custom_unit && <p className="text-red-500 text-xs mt-1">{errors.custom_unit}</p>}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                  <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value, subcategory_id: "" }))} className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white ${errors.category_id ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                    <option value="">Select</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Status</label>
                  <select value={form.stock_status} onChange={(e) => setForm((f) => ({ ...f, stock_status: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subcategory</label>
                  <select value={form.subcategory_id} onChange={(e) => setForm((f) => ({ ...f, subcategory_id: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" disabled={!form.category_id}>
                    <option value="">None</option>
                    {filteredSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-400" />
                    <span className="text-sm text-gray-700 font-medium">Featured Product</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_weight_based} onChange={(e) => setForm((f) => ({ ...f, is_weight_based: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-400" />
                    <span className="text-sm text-gray-700 font-medium">Weight-Based Pricing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-400" />
                    <span className="text-sm text-gray-700 font-medium">Active (Visible to customers)</span>
                  </label>
                </div>
              </div>
              
              {form.is_weight_based && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Inventory Management ({form.unit_type === "Custom" ? (form.custom_unit || "Unit") : form.unit_type})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Stock ({form.unit_type === "Custom" ? (form.custom_unit || "Unit") : form.unit_type})</label>
                    <input type="number" value={form.available_stock} onChange={(e) => setForm((f) => ({ ...f, available_stock: e.target.value }))} placeholder="e.g. 5" min="0" step="0.001" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Low Stock Alert ({form.unit_type === "Custom" ? (form.custom_unit || "Unit") : form.unit_type})</label>
                    <input type="number" value={form.low_stock_threshold} onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))} placeholder="e.g. 1" min="0" step="0.001" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative w-full h-40 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); if (fileRef.current) fileRef.current.value = ""; }} className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-lg shadow-sm"><X className="w-4 h-4 text-gray-600" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-green-600 hover:border-green-300 transition-colors">
                    <Upload className="w-6 h-6" /><span className="text-xs">Click to upload (JPG, PNG, WebP)</span>
                  </button>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h2>
            <p className="text-gray-500 text-sm mb-1">Are you sure you want to delete <strong className="text-gray-700">{deleteTarget.name}</strong>?</p>
            <p className="text-gray-400 text-xs mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}{deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
