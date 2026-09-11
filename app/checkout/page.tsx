import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/cart/order-summary";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { calculateTotals, getCart, lookupPromoCode } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage(props: PageProps<"/checkout">) {
  const searchParams = await props.searchParams;
  const promoInput = typeof searchParams.promo === "string" ? searchParams.promo.trim() : "";

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout&reason=checkout");

  const lines = await getCart(user.id);
  if (lines.length === 0) {
    return (
      <div className="container-page pb-16">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
        />
        <EmptyState
          title="Nothing to check out"
          description="Your cart is empty, so there is no order to place yet."
          image={{ src: "/images/states/empty-cart.png", alt: "" }}
          action={{ href: "/shop", label: "Go to shop" }}
        />
      </div>
    );
  }

  const percentOff = await lookupPromoCode(promoInput);
  const totals = calculateTotals(lines, percentOff);

  return (
    <div className="container-page pb-16">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />
      <h1 className="font-display text-3xl uppercase sm:text-4xl">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
        <CheckoutForm
          promoCode={percentOff > 0 ? promoInput : ""}
          defaults={{ fullName: user.name ?? "", email: user.email }}
        />

        <div className="lg:sticky lg:top-40">
          <OrderSummary totals={totals} percentOff={percentOff}>
            <ul className="space-y-3 border-t border-line pt-4 text-sm">
              {lines.map((line) => (
                <li key={line.id} className="flex justify-between gap-3">
                  <span className="min-w-0 text-ink-muted">
                    <span className="text-ink">{line.quantity}&times;</span> {line.product.name}
                    <span className="block text-xs">
                      {line.size.name} · {line.color.name}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatPrice(line.product.priceCents * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
