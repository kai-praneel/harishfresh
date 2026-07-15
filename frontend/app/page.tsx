import CustomerLayout from "@/components/customer/CustomerLayout";
import HeroBanner from "@/components/customer/HeroBanner";
import FreeDeliverySection from "@/components/customer/FreeDeliverySection";
import CategoriesSection from "@/components/customer/CategoriesSection";
import FeaturedProductsSection from "@/components/customer/FeaturedProductsSection";
import BulkOrdersSection from "@/components/customer/BulkOrdersSection";
import WhyChooseSection from "@/components/customer/WhyChooseSection";
import WhatsAppCTA from "@/components/customer/WhatsAppCTA";
import { settingsApi, categoriesApi, productsApi } from "@/services/api";

export const dynamic = 'force-dynamic';

async function getPageData() {
  try {
    const [settingsRes, categoriesRes, featuredRes] = await Promise.all([
      settingsApi.get(),
      categoriesApi.list(),
      productsApi.list({ featured: true }),
    ]);
    return {
      settings: settingsRes.data,
      categories: categoriesRes.data,
      featured: featuredRes.data,
    };
  } catch {
    return { settings: null, categories: [], featured: [] };
  }
}

export default async function HomePage() {
  const { settings, categories, featured } = await getPageData();

  return (
    <CustomerLayout>
      <HeroBanner settings={settings} />
      <CategoriesSection categories={categories} />
      <FeaturedProductsSection products={featured} />
      <BulkOrdersSection settings={settings} />
      <WhyChooseSection settings={settings} />
      <WhatsAppCTA settings={settings} />
    </CustomerLayout>
  );
}
