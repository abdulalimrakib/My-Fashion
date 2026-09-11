import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { parseFilters } from "@/lib/filters";
import { getFilterFacets, listProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop all",
  description:
    "Browse the full SHOP.CO catalogue — t-shirts, shirts, jeans and shorts, filtered by style, colour, size and price.",
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const filters = parseFilters(await props.searchParams);
  const [facets, result] = await Promise.all([getFilterFacets(), listProducts(filters)]);

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <ShopBrowser
        title="All Products"
        basePath="/shop"
        facets={facets}
        filters={filters}
        result={result}
      />
    </div>
  );
}
