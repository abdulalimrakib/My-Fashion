const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Money is stored as integer cents everywhere; this is the only place it becomes a string. */
export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatDate(date: Date | string): string {
  return dateFormat.format(typeof date === "string" ? new Date(date) : date);
}

/**
 * The badge percentage is always derived from the two prices shown next to it,
 * so it can never contradict them.
 */
export function discountPercent(priceCents: number, compareAtPriceCents: number | null): number {
  if (!compareAtPriceCents || compareAtPriceCents <= priceCents) return 0;
  return Math.round((1 - priceCents / compareAtPriceCents) * 100);
}
