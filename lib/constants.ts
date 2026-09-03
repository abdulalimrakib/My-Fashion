/** Flat delivery fee applied to every order, in cents. */
export const SHIPPING_CENTS = 1500;

/** Products per page in the shop grid. */
export const PAGE_SIZE = 9;

/** Highest price the range filter can express, in cents. */
export const MAX_FILTER_PRICE_CENTS = 50000;

export const SESSION_COOKIE = "shopco_session";

/** How long a sign-in lasts. */
export const SESSION_DURATION_DAYS = 30;

/**
 * Collections are computed views over the catalogue rather than rows in
 * `Category`, but they share the `/shop/[category]` route so that filtering,
 * sorting and pagination work identically on all of them.
 */
export const COLLECTIONS = [
  { slug: "new-arrivals", name: "New Arrivals" },
  { slug: "top-selling", name: "Top Selling" },
  { slug: "on-sale", name: "On Sale" },
] as const;

export type CollectionSlug = (typeof COLLECTIONS)[number]["slug"];

export function isCollectionSlug(value: string): value is CollectionSlug {
  return COLLECTIONS.some((c) => c.slug === value);
}

export const PRIMARY_NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/shop/new-arrivals", label: "New Arrivals" },
  { href: "/shop/top-selling", label: "Top Selling" },
  { href: "/shop/on-sale", label: "On Sale" },
] as const;

export const SORT_OPTIONS = [
  { value: "featured", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function isSortValue(value: string): value is SortValue {
  return SORT_OPTIONS.some((o) => o.value === value);
}

export const FOOTER_SECTIONS = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/shop" },
      { label: "Features", href: "/shop/new-arrivals" },
      { label: "Works", href: "/shop/top-selling" },
      { label: "Career", href: "/shop" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Customer Support", href: "/shop" },
      { label: "Delivery Details", href: "/shop" },
      { label: "Terms & Conditions", href: "/shop" },
      { label: "Privacy Policy", href: "/shop" },
    ],
  },
  {
    title: "FAQ",
    links: [
      { label: "Account", href: "/account" },
      { label: "Manage Deliveries", href: "/account/orders" },
      { label: "Orders", href: "/account/orders" },
      { label: "Payments", href: "/cart" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Free eBooks", href: "/shop" },
      { label: "Development Tutorial", href: "/shop" },
      { label: "How to - Blog", href: "/shop" },
      { label: "Youtube Playlist", href: "/shop" },
    ],
  },
] as const;

export const BRANDS = [
  { name: "Versace", src: "/icons/brands/versace.svg", width: 167, height: 34 },
  { name: "Zara", src: "/icons/brands/zara.svg", width: 92, height: 38 },
  { name: "Gucci", src: "/icons/brands/gucci.svg", width: 157, height: 34 },
  { name: "Prada", src: "/icons/brands/prada.svg", width: 195, height: 32 },
  { name: "Calvin Klein", src: "/icons/brands/calvin-klein.svg", width: 208, height: 34 },
] as const;
