import { formatPrice } from "@/lib/format";
import type { CartTotals } from "@/lib/cart";

type Props = {
  totals: CartTotals;
  percentOff: number;
  children?: React.ReactNode;
};

export function OrderSummary({ totals, percentOff, children }: Props) {
  return (
    <div className="space-y-5 rounded-2xl border border-line p-5 sm:p-6">
      <h2 className="text-xl font-bold sm:text-2xl">Order Summary</h2>

      <dl className="space-y-4 text-sm sm:text-base">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="font-bold">{formatPrice(totals.subtotalCents)}</dd>
        </div>
        {totals.discountCents > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Discount (&minus;{percentOff}%)</dt>
            <dd className="font-bold text-sale">&minus;{formatPrice(totals.discountCents)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Delivery Fee</dt>
          <dd className="font-bold">{formatPrice(totals.shippingCents)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line pt-4">
          <dt>Total</dt>
          <dd className="text-xl font-bold">{formatPrice(totals.totalCents)}</dd>
        </div>
      </dl>

      {children}
    </div>
  );
}
