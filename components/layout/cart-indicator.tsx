import Link from "next/link";

import { CartIcon } from "@/components/ui/icons";
import { getCartCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";

/**
 * Server component so the badge reflects the real cart on first paint. It is
 * rendered inside a Suspense boundary in the header, so the database round-trip
 * does not hold up the rest of the page.
 */
export async function CartIndicator() {
  const user = await getCurrentUser();
  const count = user ? await getCartCount(user.id) : 0;

  return (
    <Link
      href="/cart"
      className="relative rounded-full p-2 text-ink hover:bg-surface-muted"
      aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty"}
    >
      <CartIcon className="h-6 w-6" />
      {count > 0 ? (
        <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-on-ink">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

export function CartIndicatorFallback() {
  return (
    <span className="rounded-full p-2 text-ink" aria-hidden="true">
      <CartIcon className="h-6 w-6" />
    </span>
  );
}
