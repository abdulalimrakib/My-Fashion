import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { parseFilters } from "@/lib/filters";
import { getFilterFacets, listProducts, resolveShopSegment } from "@/lib/products";
import { isCollectionSlug } from "@/lib/constants";

export async function generateMetadata(
  props: PageProps<"/shop/[category]">,
): Promise<Metadata> {
  const { category } = await props.params;
  const segment = await resolveShopSegment(category);
  if (!segment) return { title: "Not found" };

  return {
    title: segment.name,
    description: `Shop ${segment.name.toLowerCase()} at SHOP.CO.`,
    alternates: { canonical: `/shop/${segment.slug}` },
  };
}

export default async function ShopCategoryPage(props: PageProps<"/shop/[category]">) {
  const [{ category }, rawSearchParams] = await Promise.all([props.params, props.searchParams]);

  const segment = await resolveShopSegment(category);
  if (!segment) notFound();

  const filters = parseFilters(rawSearchParams);

  // A category segment fixes the category; a collection segment leaves the
  // category filter available in the sidebar.
  const effectiveFilters =
    segment.kind === "category" ? { ...filters, categories: [segment.slug] } : filters;

  const [facets, result] = await Promise.all([
    getFilterFacets(),
    listProducts(
      effectiveFilters,
      isCollectionSlug(segment.slug) ? segment.slug : undefined,
    ),
  ]);

  return (
    <div className="container-page pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: segment.name },
        ]}
      />
      <ShopBrowser
        title={segment.name}
        basePath={`/shop/${segment.slug}`}
        facets={facets}
        filters={filters}
        result={result}
        showCategories={segment.kind === "collection"}
      />
    </div>
  );
}
