"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronDownIcon, CloseIcon, SlidersIcon } from "@/components/ui/icons";
import { MAX_FILTER_PRICE_CENTS } from "@/lib/constants";
import type { FilterFacets } from "@/lib/products";
import type { ProductFilters } from "@/lib/filters";
import { cn } from "@/lib/cn";

type Props = {
  facets: FilterFacets;
  filters: ProductFilters;
  /** Hidden on collection and category routes, where the segment fixes the category. */
  showCategories: boolean;
};

/**
 * All filter state is written back into the URL, so the server re-renders the
 * grid and results stay shareable and back-button-correct.
 */
function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("page"); // any filter change returns to the first page
      const query = next.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );
}

function toggleInParam(params: URLSearchParams, key: string, value: string) {
  const current = new Set((params.get(key) ?? "").split(",").filter(Boolean));
  if (current.has(value)) {
    current.delete(value);
  } else {
    current.add(value);
  }
  if (current.size) {
    params.set(key, [...current].join(","));
  } else {
    params.delete(key);
  }
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-line py-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-lg font-bold">{title}</span>
        <ChevronDownIcon className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="pt-4">{children}</div> : null}
    </div>
  );
}

function FilterBody({ facets, filters, showCategories }: Props) {
  const navigate = useFilterNavigation();
  const [minPrice, setMinPrice] = useState(Math.round(filters.minCents / 100));
  const [maxPrice, setMaxPrice] = useState(Math.round(filters.maxCents / 100));
  const priceCeiling = MAX_FILTER_PRICE_CENTS / 100;

  return (
    <div>
      {showCategories ? (
        <Group title="Category">
          <ul className="space-y-3">
            {facets.categories.map((category) => (
              <li key={category.slug}>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-ink-muted">
                  <span>{category.name}</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-black"
                    checked={filters.categories.includes(category.slug)}
                    onChange={() =>
                      navigate((params) => toggleInParam(params, "category", category.slug))
                    }
                  />
                </label>
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      <Group title="Price">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label htmlFor="filter-min-price" className="text-xs text-ink-muted">
                Min
              </label>
              <input
                id="filter-min-price"
                type="number"
                min={0}
                max={priceCeiling}
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-full rounded-full bg-surface-muted px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label htmlFor="filter-max-price" className="text-xs text-ink-muted">
                Max
              </label>
              <input
                id="filter-max-price"
                type="number"
                min={0}
                max={priceCeiling}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full rounded-full bg-surface-muted px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={priceCeiling}
            step={10}
            value={maxPrice}
            aria-label="Maximum price"
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-black"
          />

          <Button
            size="sm"
            className="w-full"
            onClick={() =>
              navigate((params) => {
                const lo = Math.max(0, Math.min(minPrice, maxPrice));
                const hi = Math.min(priceCeiling, Math.max(minPrice, maxPrice));
                if (lo > 0) params.set("min", String(lo));
                else params.delete("min");
                if (hi < priceCeiling) params.set("max", String(hi));
                else params.delete("max");
              })
            }
          >
            Apply price
          </Button>
        </div>
      </Group>

      <Group title="Colors">
        <div className="flex flex-wrap gap-3">
          {facets.colors.map((color) => {
            const selected = filters.colors.includes(color.slug);
            return (
              <button
                key={color.slug}
                type="button"
                aria-pressed={selected}
                aria-label={color.name}
                onClick={() => navigate((params) => toggleInParam(params, "color", color.slug))}
                style={{ backgroundColor: color.hex }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset ring-line-strong",
                  selected && "ring-2 ring-ink",
                )}
              >
                {selected ? (
                  <CheckIcon
                    className={cn(
                      "h-4 w-4",
                      color.slug === "white" || color.slug === "yellow"
                        ? "text-ink"
                        : "text-white",
                    )}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Size">
        <div className="flex flex-wrap gap-2">
          {facets.sizes.map((size) => {
            const selected = filters.sizes.includes(size.slug);
            return (
              <button
                key={size.slug}
                type="button"
                aria-pressed={selected}
                onClick={() => navigate((params) => toggleInParam(params, "size", size.slug))}
                className={cn(
                  "min-h-9 rounded-full px-4 text-sm transition-colors",
                  selected ? "bg-ink text-white" : "bg-surface-muted text-ink-muted hover:bg-line",
                )}
              >
                {size.name}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Dress Style">
        <ul className="space-y-3">
          {facets.styles.map((style) => (
            <li key={style.slug}>
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-ink-muted">
                <span>{style.name}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-black"
                  checked={filters.styles.includes(style.slug)}
                  onChange={() => navigate((params) => toggleInParam(params, "style", style.slug))}
                />
              </label>
            </li>
          ))}
        </ul>
      </Group>
    </div>
  );
}

/** Sticky sidebar at `lg` and above; a bottom sheet behind a button below it. */
export function FilterControls(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden lg:sticky lg:top-40 lg:block lg:h-fit lg:w-[18.5rem] lg:shrink-0">
        <div className="rounded-2xl border border-line px-5 pb-5">
          <div className="flex items-center justify-between py-5">
            <h2 className="text-xl font-bold">Filters</h2>
            <SlidersIcon className="h-5 w-5 text-ink-subtle" />
          </div>
          <FilterBody {...props} />
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm lg:hidden"
      >
        <SlidersIcon className="h-4 w-4" />
        Filters
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface p-6"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="rounded-full p-2 hover:bg-surface-muted"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <FilterBody {...props} />
            <Button className="mt-4 w-full" size="lg" onClick={() => setOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
