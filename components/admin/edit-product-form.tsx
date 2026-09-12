"use client";

import { useState } from "react";

import { ProductForm } from "@/components/admin/product-form";
import { updateProductAction } from "@/lib/actions/admin-products";
import { draftFromProduct } from "@/lib/admin/product-draft";
import type { AdminProductDetail, CatalogueOptions } from "@/lib/admin/product-service";

/**
 * Seeds the wizard from a saved product. The conversion happens here rather
 * than on the server because a draft carries client-side row keys, which have
 * no meaning until the form is interactive.
 */
export function EditProductForm({
  product,
  options,
}: {
  product: AdminProductDetail;
  options: CatalogueOptions;
}) {
  const [initialDraft] = useState(() => draftFromProduct(product));

  return (
    <ProductForm
      options={options}
      action={updateProductAction}
      productId={product.id}
      initialDraft={initialDraft}
      submitLabel="Save changes"
      cancelHref="/admin/products"
    />
  );
}
