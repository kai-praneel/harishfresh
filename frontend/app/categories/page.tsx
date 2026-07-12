import CustomerLayout from "@/components/customer/CustomerLayout";
import CategoriesSection from "@/components/customer/CategoriesSection";
import { categoriesApi } from "@/services/api";

async function getCategories() {
  try {
    const res = await categoriesApi.list();
    return res.data;
  } catch (error) {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <CustomerLayout>
      <div className="bg-white min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 pt-8">
          <nav className="text-sm text-gray-500 mb-2">
            <a href="/" className="hover:text-green-600">Home</a>
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">Categories</span>
          </nav>
        </div>
        
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Categories Found</h2>
            <p className="text-gray-500">We are currently updating our catalog. Please check back later.</p>
          </div>
        ) : (
          <CategoriesSection categories={categories} />
        )}
      </div>
    </CustomerLayout>
  );
}
