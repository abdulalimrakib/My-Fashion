import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { requireUserOrRedirect } from "@/lib/auth";
import { listOrdersForUser } from "@/lib/orders";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false },
};

export default async function OrdersPage() {
  const user = await requireUserOrRedirect("/account/orders");
  const orders = await listOrdersForUser(user.id);

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Once you place an order it will appear here with its full contents and status."
        image={{ src: "/images/states/empty-cart.png", alt: "" }}
        action={{ href: "/shop", label: "Start shopping" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl uppercase sm:text-4xl">My orders</h1>

      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/account/orders/${order.orderNumber}`}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-line p-5 transition-colors hover:bg-surface-muted"
            >
              <div className="flex -space-x-3">
                {order.items.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className="relative h-12 w-12 overflow-hidden rounded-full bg-surface-muted ring-2 ring-surface"
                  >
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-contain p-1" />
                    ) : null}
                  </span>
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium">{order.orderNumber}</p>
                <p className="text-sm text-ink-muted">
                  {formatDate(order.createdAt)} ·{" "}
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold">{formatPrice(order.totalCents)}</p>
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  {order.status === "PENDING" ? "Pending payment" : order.status}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
