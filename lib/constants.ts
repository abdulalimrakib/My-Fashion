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

/**
 * Editorial photography for the "Browse by dress style" cards, keyed by
 * `DressStyle.slug`.
 *
 * These live in code rather than in the database on purpose: the files ship in
 * `public/`, so a column holding their paths would be a second place to keep in
 * sync with no extra flexibility — the image could not change without a deploy
 * either way. A style with no entry here simply renders as a label-only card.
 *
 * `objectPosition` is per-photo and not eyeballed. `object-fit: cover`
 * distributes the overflow by that percentage, so the visible band starts at
 * `P x (1 - cardHeight / scaledImageHeight)`. Each value below is solved from
 * that for the card's real geometry, which is why the portrait shots sit near
 * 6-7%: at a 2.6:1 card they only show about a quarter of their height, and
 * anything larger cuts the subject's head off.
 */
export const DRESS_STYLE_IMAGES: Record<
  string,
  { src: string; objectPosition: string; blurDataURL: string }
> = {
  casual: {
    src: "/images/casual.jpeg",
    objectPosition: "50% 27%",
    blurDataURL:
      "data:image/webp;base64,UklGRn4AAABXRUJQVlA4IHIAAADwAQCdASoQABAAAwBSJZQC7AYtLL8mXAAA/KuTi7q8oLINTJtPf4pUWX3ay1kY2PigCoDo1AC6ze92bIDMq1OcwtNRt27VChHjHCdLo1viwtt7EbEOIwQ8FVVwbJ9m24csk8jAC6w7omzFWA6JL3kTgAA=",
  },
  formal: {
    src: "/images/formal.jpeg",
    objectPosition: "50% 12%",
    blurDataURL:
      "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAADwAQCdASoQAAsAAwBSJZwAD43tYkAcw2gA/vj6Is1cl7m9OMJtGfeFig/8hMaFRQBmdiW6bhX8WbDrR0YyKfNbvY9Nymypj/zkdMRoAAA=",
  },
  party: {
    src: "/images/party.jpeg",
    objectPosition: "50% 7%",
    blurDataURL:
      "data:image/webp;base64,UklGRr4AAABXRUJQVlA4ILIAAACwBACdASoQABcAPt1epkyopSOiMAgBEBuJQBOmUGYW6Qeq0meI2iKniSYMXMccAP79fSE+NWkpff3+VlTbwP++7HXD9lB8f40Ux1+VqE1uvl62aMB+J3P6aZfswykwdkeqPjsU31v3q+kEUqOvSMNyWdeG0DjLG9bUC7HgTdIoAJbakGA1dRsG7D/4aRfNo2RnQ9gyA5WANzR7wLYkUZo40VF7WbdeovZdqtBb3shzMYAA",
  },
  gym: {
    src: "/images/gym.jpeg",
    objectPosition: "50% 6%",
    blurDataURL:
      "data:image/webp;base64,UklGRsgAAABXRUJQVlA4ILwAAABQBACdASoQABgAPt1cpkyopSOiMAgBEBuJQBYdsX/cAvuqylcZu2a9Sp0AAP7zfhacXu3gDWEjXXZrneLQ6PPz8IIzHyLKHes+jfLo/P2PlY2sKcDwEaCfbMlUx6NcOmwLIlr1L2YKu+JK/h3ZXP98r/9jX9l/kNZo8j8/8zwIX1EuBHdp11Jf4mDUBn8bhPcDfvSdyWBUIjqIcn1Hj9jXoEKJlALBGgPLAE/mME8pqwW7I8k6ipdCm7eIAA==",
  },
};

export const BRANDS = [
  { name: "Versace", src: "/icons/brands/versace.svg", width: 167, height: 34 },
  { name: "Zara", src: "/icons/brands/zara.svg", width: 92, height: 38 },
  { name: "Gucci", src: "/icons/brands/gucci.svg", width: 157, height: 34 },
  { name: "Prada", src: "/icons/brands/prada.svg", width: 195, height: 32 },
  { name: "Calvin Klein", src: "/icons/brands/calvin-klein.svg", width: 208, height: 34 },
] as const;
