import { MAX_FILTER_PRICE_CENTS, isSortValue, type SortValue } from "@/lib/constants";

export type ProductFilters = {
  categories: string[];
  styles: string[];
  colors: string[];
  sizes: string[];
  minCents: number;
  maxCents: number;
  sort: SortValue;
  page: number;
  q: string;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function list(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const parts = Array.isArray(value) ? value : value.split(",");
  return [...new Set(parts.map((p) => p.trim()).filter(Boolean))];
}

function one(value: string | string[] | undefined): string {
  if (!value) return "";
  return (Array.isArray(value) ? value[0] : value).trim();
}

function int(value: string | string[] | undefined, fallback: number): number {
  const parsed = Number.parseInt(one(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * All shop state lives in the URL, so results are shareable and the back button
 * behaves. This is the single place query strings become typed filters.
 */
export function parseFilters(params: RawSearchParams): ProductFilters {
  const min = Math.max(0, int(params.min, 0) * 100);
  const max = Math.min(MAX_FILTER_PRICE_CENTS, int(params.max, MAX_FILTER_PRICE_CENTS / 100) * 100);
  const sort = one(params.sort);

  return {
    categories: list(params.category),
    styles: list(params.style),
    colors: list(params.color),
    sizes: list(params.size),
    minCents: Math.min(min, max),
    maxCents: Math.max(min, max),
    sort: isSortValue(sort) ? sort : "featured",
    page: Math.max(1, int(params.page, 1)),
    q: one(params.q),
  };
}

/** Inverse of `parseFilters`; omits anything at its default so URLs stay short. */
export function buildQuery(filters: Partial<ProductFilters>): string {
  const search = new URLSearchParams();
  const add = (key: string, values: string[] | undefined) => {
    if (values?.length) search.set(key, values.join(","));
  };

  add("category", filters.categories);
  add("style", filters.styles);
  add("color", filters.colors);
  add("size", filters.sizes);

  if (filters.minCents) search.set("min", String(Math.round(filters.minCents / 100)));
  if (filters.maxCents !== undefined && filters.maxCents < MAX_FILTER_PRICE_CENTS) {
    search.set("max", String(Math.round(filters.maxCents / 100)));
  }
  if (filters.sort && filters.sort !== "featured") search.set("sort", filters.sort);
  if (filters.page && filters.page > 1) search.set("page", String(filters.page));
  if (filters.q) search.set("q", filters.q);

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    filters.categories.length > 0 ||
    filters.styles.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.minCents > 0 ||
    filters.maxCents < MAX_FILTER_PRICE_CENTS
  );
}
