import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUserOrRedirect } from "@/lib/auth";
import { getOrderForUser } from "@/lib/orders";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false },
};

export default async function OrderDetailPage(
  props: PageProps<"/account/orders/[orderNumber]">,
) {
  const { orderNumber } = await props.params;
  const user = await requireUserOrRedirect(`/account/orders/${orderNumber}`);

  const order = await getOrderForUser(orderNumber, user.id);
  if (!order) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Link href="/account/orders" className="text-sm text-ink-muted hover:text-ink">
          ← All orders
        </Link>
        <h1 className="font-display text-2xl uppercase sm:text-3xl">
          Order <span className="font-mono normal-case">{order.orderNumber}</span>
        </h1>
        <p className="text-sm text-ink-muted">
          Placed {formatDate(order.createdAt)} ·{" "}
          {order.status === "PENDING" ? "Pending payment" : order.status}
        </p>
      </div>

      <ul className="rounded-2xl border border-line px-5">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 border-b border-line py-4 last:border-b-0">
            <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-contain p-2" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold">
                <Link href={`/product/${item.slug}`} className="hover:underline">
                  {item.name}
                </Link>
              </h2>
              <p className="text-sm text-ink-muted">
                {item.sizeName} · {item.colorName} · Qty {item.quantity}
              </p>
            </div>
            <p className="shrink-0 font-bold">
              {formatPrice(item.unitPriceCents * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-line p-5">
          <h2 className="font-bold">Delivery address</h2>
          <address className="text-sm not-italic leading-relaxed text-ink-muted">
            {order.fullName}
            <br />
            {order.address1}
            {order.address2 ? (
              <>
                <br />
                {order.address2}
              </>
            ) : null}
            <br />
            {order.city} {order.postalCode}
            <br />
            {order.country}
            <br />
            {order.phone}
          </address>
        </div>

        <dl className="space-y-3 rounded-2xl border border-line p-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="font-medium">{formatPrice(order.subtotalCents)}</dd>
          </div>
          {order.discountCents > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">
                Discount{order.promoCode ? ` (${order.promoCode})` : ""}
              </dt>
              <dd className="font-medium text-sale">&minus;{formatPrice(order.discountCents)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Delivery</dt>
            <dd className="font-medium">{formatPrice(order.shippingCents)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-3">
            <dt>Total</dt>
            <dd className="text-lg font-bold">{formatPrice(order.totalCents)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
