import type { Metadata } from "next";

import { CartLine } from "@/components/cart/cart-line";
import { OrderSummary } from "@/components/cart/order-summary";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TagIcon } from "@/components/ui/icons";
import { calculateTotals, getCart, lookupPromoCode } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false },
};

export default async function CartPage(props: PageProps<"/cart">) {
  const searchParams = await props.searchParams;
  const promoInput = typeof searchParams.promo === "string" ? searchParams.promo.trim() : "";

  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container-page pb-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
        <EmptyState
          title="Sign in to see your cart"
          description="Your cart is tied to your account, so it is waiting for you on every device you sign in from."
          image={{ src: "/images/states/empty-cart.png", alt: "" }}
          action={{ href: "/login?next=/cart&reason=cart", label: "Sign in" }}
        />
      </div>
    );
  }

  const lines = await getCart(user.id);

  if (lines.length === 0) {
    return (
      <div className="container-page pb-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
        <EmptyState
          title="Your cart is empty"
          description="Add a few pieces you like and they will show up here, ready for checkout."
          image={{ src: "/images/states/empty-cart.png", alt: "" }}
          action={{ href: "/shop", label: "Go to shop" }}
        />
      </div>
    );
  }

  // The code is validated against the database on every render, so an invalid
  // or expired code in the URL simply does not apply.
  const percentOff = await lookupPromoCode(promoInput);
  const totals = calculateTotals(lines, percentOff);

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <h1 className="font-display text-3xl uppercase sm:text-4xl">Your Cart</h1>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_24rem] lg:items-start">
        <ul className="rounded-2xl border border-line px-5">
          {lines.map((line) => (
            <CartLine key={line.id} line={line} />
          ))}
        </ul>

        <div className="lg:sticky lg:top-40">
          <OrderSummary totals={totals} percentOff={percentOff}>
            {/* A plain GET form: it works without JavaScript and keeps the
                applied code in the URL so /checkout sees the same discount. */}
            <form action="/cart" method="get" className="space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-full bg-surface-muted px-4">
                  <TagIcon className="h-5 w-5 shrink-0 text-ink-subtle" />
                  <label htmlFor="promo" className="sr-only">
                    Promo code
                  </label>
                  <input
                    id="promo"
                    name="promo"
                    defaultValue={promoInput}
                    placeholder="Add promo code"
                    className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-ink-subtle"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-11 rounded-full bg-ink px-6 text-sm font-medium text-on-ink hover:bg-ink/85"
                >
                  Apply
                </button>
              </div>

              {promoInput && percentOff === 0 ? (
                <p role="alert" className="text-sm text-sale">
                  That promo code is not valid.
                </p>
              ) : null}
              {percentOff > 0 ? (
                <p role="status" className="text-sm text-positive">
                  {percentOff}% off applied.
                </p>
              ) : (
                <p className="text-xs text-ink-muted">Try SHOPCO20 for 20% off.</p>
              )}
            </form>

            <ButtonLink
              href={percentOff > 0 ? `/checkout?promo=${encodeURIComponent(promoInput)}` : "/checkout"}
              size="lg"
              className="w-full"
            >
              Go to Checkout
            </ButtonLink>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
