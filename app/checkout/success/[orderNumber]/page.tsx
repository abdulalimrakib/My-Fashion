import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getOrderForUser } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function CheckoutSuccessPage(
  props: PageProps<"/checkout/success/[orderNumber]">,
) {
  const { orderNumber } = await props.params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/checkout/success/${orderNumber}&reason=account`);

  // Scoped to the signed-in user, so an order number alone is not enough to view it.
  const order = await getOrderForUser(orderNumber, user.id);
  if (!order) notFound();

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Order confirmed" }]} />

      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <h1 className="font-display text-3xl uppercase leading-tight sm:text-4xl">
            Thank you for your order
          </h1>
          <p className="text-sm text-ink-muted sm:text-base">
            Order{" "}
            <span className="font-mono font-medium text-ink">{order.orderNumber}</span> has been
            recorded against your account. We&rsquo;ve saved the details below.
          </p>

          <dl className="space-y-3 rounded-2xl border border-line p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Status</dt>
              <dd className="font-medium">
                {order.status === "PENDING" ? "Pending payment" : order.status}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Items</dt>
              <dd className="font-medium">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Delivering to</dt>
              <dd className="max-w-[60%] text-right font-medium">
                {order.address1}, {order.city} {order.postalCode}, {order.country}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-3">
              <dt>Total</dt>
              <dd className="text-lg font-bold">{formatPrice(order.totalCents)}</dd>
            </div>
          </dl>

          <p className="rounded-2xl bg-surface-muted px-5 py-4 text-sm text-ink-muted">
            No payment has been taken — this storefront has no payment provider connected, so the
            order stays at <span className="font-medium text-ink">Pending</span>.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={`/account/orders/${order.orderNumber}`} size="lg">
              View order
            </ButtonLink>
            <ButtonLink href="/shop" variant="secondary" size="lg">
              Continue shopping
            </ButtonLink>
          </div>
        </div>

        <Image
          src="/images/states/order-confirmed.gif"
          alt=""
          aria-hidden="true"
          width={600}
          height={600}
          // Animated GIFs are passed through rather than reprocessed.
          unoptimized
          className="mx-auto h-auto w-full max-w-sm lg:max-w-md"
        />
      </div>
    </div>
  );
}
