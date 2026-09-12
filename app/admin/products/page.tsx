import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdminOrRedirect } from "@/lib/auth";
import { listProductsForAdmin } from "@/lib/admin/product-service";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false },
};

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  const admin = await requireAdminOrRedirect("/admin/products");
  const [products, searchParams] = await Promise.all([
    listProductsForAdmin(admin),
    props.searchParams,
  ]);

  const saved = typeof searchParams.saved === "string" ? searchParams.saved : null;
  const savedAction = searchParams.action === "updated" ? "updated" : "created";
  const deleted = searchParams.deleted === "1";
  const error = typeof searchParams.error === "string" ? searchParams.error : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase sm:text-4xl">Products</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {products.length} {products.length === 1 ? "product" : "products"} in the catalogue.
          </p>
        </div>
        <ButtonLink href="/admin/products/new">Add product</ButtonLink>
      </div>

      {saved ? (
        <p role="status" className="rounded-2xl border border-line bg-surface-muted px-4 py-3 text-sm">
          Product {savedAction}.{" "}
          <Link href={`/product/${saved}`} className="font-medium underline underline-offset-4">
            View it on the storefront
          </Link>
          .
        </p>
      ) : null}
      {deleted ? (
        <p role="status" className="rounded-2xl border border-line bg-surface-muted px-4 py-3 text-sm">
          Product deleted. Past orders keep their own record of it.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-2xl bg-sale-soft px-4 py-3 text-sm font-medium text-sale">
          {error}
        </p>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add the first product to the catalogue, with a photograph for every colour it comes in."
          action={{ href: "/admin/products/new", label: "Add product" }}
        />
      ) : (
        <ul className="space-y-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-line p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                {product.variants[0]?.images[0] ? (
                  <Image
                    src={product.variants[0].images[0].url}
                    alt=""
                    fill
                    className="object-contain p-1.5"
                    sizes="80px"
                    placeholder="blur"
                    blurDataURL={product.variants[0].images[0].blurDataUrl}
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="font-bold leading-snug">{product.name}</p>
                <p className="text-sm text-ink-muted">
                  {product.category.name} · {formatPrice(product.priceCents)}
                  {product.compareAtPriceCents ? " · on sale" : ""} · updated{" "}
                  {formatDate(product.updatedAt)}
                </p>
                <ul className="flex flex-wrap items-center gap-1.5" aria-label="Colours">
                  {product.variants.map((variant) => (
                    <li
                      key={variant.id}
                      title={`${variant.color.name}${variant.images.length ? "" : " — no image"}`}
                      style={{ backgroundColor: variant.color.hex }}
                      className="h-5 w-5 rounded-full ring-1 ring-inset ring-line-strong"
                    >
                      <span className="sr-only">{variant.color.name}</span>
                    </li>
                  ))}
                  <li className="ml-1 text-xs text-ink-subtle">
                    {product.variants.length}{" "}
                    {product.variants.length === 1 ? "colour" : "colours"}
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-2">
                <ButtonLink href={`/admin/products/${product.id}/edit`} variant="secondary" size="sm">
                  Edit
                </ButtonLink>
                <DeleteProductButton productId={product.id} productName={product.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
