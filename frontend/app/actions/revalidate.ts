"use server";

import { revalidatePath } from "next/cache";

export async function revalidateProducts() {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/product/[id]", "page");
}

export async function revalidateCategories() {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/category/[slug]", "page");
}
