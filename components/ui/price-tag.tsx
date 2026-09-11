import { cn } from "@/lib/cn";
import { discountPercent, formatPrice } from "@/lib/format";

type Props = {
  priceCents: number;
  compareAtPriceCents?: number | null;
  size?: "sm" | "lg";
  className?: string;
};

export function PriceTag({ priceCents, compareAtPriceCents, size = "sm", className }: Props) {
  const percent = discountPercent(priceCents, compareAtPriceCents ?? null);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className={cn("font-bold text-ink", size === "lg" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl")}>
        {formatPrice(priceCents)}
      </span>
      {percent > 0 && compareAtPriceCents ? (
        <>
          <span
            className={cn(
              "font-bold text-ink-subtle line-through",
              size === "lg" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl",
            )}
          >
            {formatPrice(compareAtPriceCents)}
          </span>
          <span
            className={cn(
              "rounded-full bg-sale-soft px-2.5 py-0.5 font-medium text-sale",
              size === "lg" ? "text-sm" : "text-xs",
            )}
          >
            −{percent}%
          </span>
        </>
      ) : null}
    </div>
  );
}
