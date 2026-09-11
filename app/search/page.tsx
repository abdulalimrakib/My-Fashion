import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { EmptyState } from "@/components/ui/empty-state";
import { parseFilters } from "@/lib/filters";
import { getFilterFacets, listProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

export default async function SearchPage(props: PageProps<"/search">) {
  const filters = parseFilters(await props.searchParams);

  if (!filters.q) {
    return (
      <div className="container-page pb-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
        <EmptyState
          title="What are you looking for?"
          description="Use the search box at the top of the page to find products by name, description or category."
          action={{ href: "/shop", label: "Browse all products" }}
        />
      </div>
    );
  }

  const [facets, result] = await Promise.all([getFilterFacets(), listProducts(filters)]);

  return (
    <div className="container-page pb-16">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "Search" }]}
      />
      {result.total === 0 ? (
        <EmptyState
          title="No results"
          description={`We couldn't find anything matching “${filters.q}”. Try a different word, or browse the full catalogue.`}
          action={{ href: "/shop", label: "Browse all products" }}
        />
      ) : (
        <ShopBrowser
          title={`Results for “${filters.q}”`}
          basePath="/search"
          facets={facets}
          filters={filters}
          result={result}
        />
      )}
    </div>
  );
}
