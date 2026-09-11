import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { requireUserOrRedirect } from "@/lib/auth";
import { listOrdersForUser } from "@/lib/orders";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await requireUserOrRedirect("/account");
  const orders = await listOrdersForUser(user.id);
  const latest = orders[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl uppercase sm:text-4xl">My account</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Signed in as <span className="font-medium text-ink">{user.email}</span>
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line p-5">
          <dt className="text-sm text-ink-muted">Name</dt>
          <dd className="mt-1 text-lg font-bold">{user.name ?? "Not set"}</dd>
        </div>
        <div className="rounded-2xl border border-line p-5">
          <dt className="text-sm text-ink-muted">Orders placed</dt>
          <dd className="mt-1 text-lg font-bold">{orders.length}</dd>
        </div>
      </dl>

      {latest ? (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Most recent order</h2>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line p-5">
            <div>
              <p className="font-mono text-sm font-medium">{latest.orderNumber}</p>
              <p className="text-sm text-ink-muted">
                {formatDate(latest.createdAt)} · {formatPrice(latest.totalCents)}
              </p>
            </div>
            <ButtonLink href={`/account/orders/${latest.orderNumber}`} variant="secondary" size="sm">
              View order
            </ButtonLink>
          </div>
        </section>
      ) : (
        <p className="rounded-2xl border border-line px-5 py-8 text-center text-sm text-ink-muted">
          You haven&rsquo;t placed an order yet.
        </p>
      )}

      <form action={signOut} className="border-t border-line pt-6">
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </div>
  );
}
