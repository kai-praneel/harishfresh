import CustomerLayout from "@/components/customer/CustomerLayout";
import ProductCard from "@/components/customer/ProductCard";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { categoriesApi, productsApi } from "@/services/api";
import { Category, Product } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subcategory?: string; sort?: string }>;
}

export const dynamic = 'force-dynamic';

async function getPageData(slug: string, subcategoryId?: string, sort?: string) {
  try {
    const [catRes, productsRes] = await Promise.all([
      categoriesApi.get(slug),
      productsApi.list({
        category_id: undefined, // will be set after we get category
        sort: sort || undefined,
      }),
    ]);
    const cat: Category = catRes.data;
    const filteredProducts = await productsApi.list({
      category_id: cat.id,
      subcategory_id: subcategoryId ? parseInt(subcategoryId) : undefined,
      sort: sort || undefined,
    });
    return { category: cat, products: filteredProducts.data as Product[] };
  } catch {
    return { category: null, products: [] };
  }
}

export default async function CategoryPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { category, products } = await getPageData(
    params.slug,
    searchParams.subcategory,
    searchParams.sort
  );

  if (!category) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">Category not found</h1>
            <Link href="/" className="text-green-600 hover:underline">← Back to Home</Link>
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
          <span className="text-gray-800 font-medium">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-gray-500">{category.description}</p>
          )}
        </div>

        {/* Subcategory filter */}
        {category.subcategories?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href={`/category/${params.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !searchParams.subcategory
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </Link>
            {category.subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${params.slug}?subcategory=${sub.id}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  searchParams.subcategory === String(sub.id)
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{products.length} products</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <Link
              href={`/category/${params.slug}${searchParams.subcategory ? `?subcategory=${searchParams.subcategory}&` : "?"}sort=price_asc`}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                searchParams.sort === "price_asc"
                  ? "bg-green-100 text-green-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Price ↑
            </Link>
            <Link
              href={`/category/${params.slug}${searchParams.subcategory ? `?subcategory=${searchParams.subcategory}&` : "?"}sort=price_desc`}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                searchParams.sort === "price_desc"
                  ? "bg-green-100 text-green-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Price ↓
            </Link>
          </div>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] border border-gray-50 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mt-8">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🛒</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-8 font-medium">Check back soon for updates</p>
            <Link href="/search" className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-8 rounded-full transition-all duration-200 shadow-[0_4px_14px_0_rgb(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
