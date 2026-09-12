import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/product-form";
import { requireAdminOrRedirect } from "@/lib/auth";
import { createProductAction } from "@/lib/actions/admin-products";
import { getCatalogueOptions } from "@/lib/admin/product-service";

export const metadata: Metadata = {
  title: "Add product",
  robots: { index: false },
};

export default async function NewProductPage() {
  await requireAdminOrRedirect("/admin/products/new");
  const options = await getCatalogueOptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase sm:text-4xl">Add product</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Enter the details once, then add a colour and a photograph for each colourway.
        </p>
      </div>

      <ProductForm
        options={options}
        action={createProductAction}
        submitLabel="Create product"
        cancelHref="/admin/products"
      />
    </div>
  );
}
