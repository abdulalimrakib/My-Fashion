import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditProductForm } from "@/components/admin/edit-product-form";
import { requireAdminOrRedirect } from "@/lib/auth";
import { getCatalogueOptions, getProductForAdmin } from "@/lib/admin/product-service";

export const metadata: Metadata = {
  title: "Edit product",
  robots: { index: false },
};

export default async function EditProductPage(props: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await props.params;
  const admin = await requireAdminOrRedirect(`/admin/products/${id}/edit`);

  const [product, options] = await Promise.all([
    getProductForAdmin(admin, id),
    getCatalogueOptions(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase sm:text-4xl">Edit product</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Add or remove colours, replace a photograph, or update the shared details.
        </p>
      </div>

      <EditProductForm product={product} options={options} />
    </div>
  );
}
