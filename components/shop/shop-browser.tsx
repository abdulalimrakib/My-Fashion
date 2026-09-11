import { FilterControls } from "@/components/shop/filter-controls";
import { Pagination } from "@/components/shop/pagination";
import { ProductGrid } from "@/components/product/product-grid";
import { SortSelect } from "@/components/shop/sort-select";
import { EmptyState } from "@/components/ui/empty-state";
import { PAGE_SIZE } from "@/lib/constants";
import { buildQuery, type ProductFilters } from "@/lib/filters";
import type { FilterFacets, ProductListResult } from "@/lib/products";

type Props = {
  title: string;
  basePath: string;
  facets: FilterFacets;
  filters: ProductFilters;
  result: ProductListResult;
  showCategories?: boolean;
};

/**
 * The listing body shared by `/shop`, `/shop/[category]` and `/search`, so the
 * three routes cannot drift apart in layout or behaviour.
 */
export function ShopBrowser({
  title,
  basePath,
  facets,
  filters,
  result,
  showCategories = true,
}: Props) {
  const { products, total, page, pageCount } = result;
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <FilterControls facets={facets} filters={filters} showCategories={showCategories} />

      <section className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-ink-muted sm:block">
              {total === 0 ? "No products" : `Showing ${first}–${last} of ${total} products`}
            </p>
            <SortSelect value={filters.sort} />
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState
            title="Nothing matches those filters"
            description="Try widening the price range or clearing a filter to see more of the collection."
            action={{ href: `${basePath}${buildQuery({ q: filters.q })}`, label: "Clear filters" }}
          />
        ) : (
          <div className="space-y-8">
            <ProductGrid products={products} priorityCount={3} />
            <Pagination
              page={page}
              pageCount={pageCount}
              buildHref={(next) => `${basePath}${buildQuery({ ...filters, page: next })}`}
            />
          </div>
        )}
      </section>
    </div>
  );
}
