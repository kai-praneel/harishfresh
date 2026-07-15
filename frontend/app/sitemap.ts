import { MetadataRoute } from "next";
import { categoriesApi, productsApi } from "@/services/api";
import { Category, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://harishfresh.com";

  try {
    const [categoriesRes, productsRes] = await Promise.all([
      categoriesApi.list(),
      productsApi.list(),
    ]);

    const categories: Category[] = categoriesRes.data;
    const products: Product[] = productsRes.data;

    // Homepage
    const sitemapEntries: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
    ];

    // Categories
    categories.forEach((category) => {
      const lastModStr = category.updated_at || category.created_at;
      sitemapEntries.push({
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: lastModStr ? new Date(lastModStr) : new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    });

    // Products
    products.forEach((product) => {
      // Exclude inactive or disabled products
      if (product.is_active) {
        const lastModStr = product.updated_at || product.created_at;
        sitemapEntries.push({
          url: `${baseUrl}/product/${product.id}`,
          lastModified: lastModStr ? new Date(lastModStr) : new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    });

    return sitemapEntries;
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return at least the homepage if API fails
    return [
      {
        url: `${baseUrl}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
    ];
  }
}
