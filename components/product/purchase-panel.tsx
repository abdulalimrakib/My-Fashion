"use client";

import { useActionState, useId, useState } from "react";

import { addToCart } from "@/lib/actions/cart";
import { toggleWishlist } from "@/lib/actions/wishlist";
import { Button } from "@/components/ui/button";
import { CheckIcon, HeartIcon } from "@/components/ui/icons";
import { emptyFormState } from "@/lib/validation";
import { cn } from "@/lib/cn";

type Color = { id: string; slug: string; name: string; hex: string };
type Size = { id: string; slug: string; name: string };

type Props = {
  productId: string;
  colors: Color[];
  sizes: Size[];
  returnTo: string;
  initiallyWishlisted: boolean;
};

/**
 * Owns the variant selection for a product. A colour and a size are both
 * required before the item can be added, which matches the reference UX and
 * keeps `CartItem`'s composite unique key non-nullable.
 */
export function PurchasePanel({
  productId,
  colors,
  sizes,
  returnTo,
  initiallyWishlisted,
}: Props) {
  const [colorId, setColorId] = useState(colors[0]?.id ?? "");
  const [sizeId, setSizeId] = useState(sizes[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [wishlistPending, setWishlistPending] = useState(false);

  const [state, formAction, pending] = useActionState(addToCart, emptyFormState);
  const colorLabelId = useId();
  const sizeLabelId = useId();

  const canSubmit = Boolean(colorId) && Boolean(sizeId);

  return (
    <div className="space-y-6">
      {colors.length > 0 ? (
        <div className="space-y-3 border-t border-line pt-6">
          <p id={colorLabelId} className="text-sm text-ink-muted">
            Select Colors
          </p>
          <div role="radiogroup" aria-labelledby={colorLabelId} className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const selected = color.id === colorId;
              return (
                <button
                  key={color.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={color.name}
                  onClick={() => setColorId(color.id)}
                  style={{ backgroundColor: color.hex }}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset ring-line-strong",
                    selected && "ring-2 ring-ink",
                  )}
                >
                  {selected ? (
                    <CheckIcon
                      className={cn(
                        "h-5 w-5",
                        color.slug === "white" || color.slug === "yellow"
                          ? "text-ink"
                          : "text-white",
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {sizes.length > 0 ? (
        <div className="space-y-3 border-t border-line pt-6">
          <p id={sizeLabelId} className="text-sm text-ink-muted">
            Choose Size
          </p>
          <div role="radiogroup" aria-labelledby={sizeLabelId} className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const selected = size.id === sizeId;
              return (
                <button
                  key={size.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSizeId(size.id)}
                  className={cn(
                    "min-h-11 rounded-full px-5 text-sm transition-colors",
                    selected
                      ? "bg-ink text-white"
                      : "bg-surface-muted text-ink-muted hover:bg-line",
                  )}
                >
                  {size.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <form action={formAction} className="space-y-3 border-t border-line pt-6">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="colorId" value={colorId} />
        <input type="hidden" name="sizeId" value={sizeId} />
        <input type="hidden" name="quantity" value={quantity} />
        <input type="hidden" name="returnTo" value={returnTo} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center justify-between gap-2 rounded-full bg-surface-muted px-2 sm:w-40">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none disabled:opacity-40"
            >
              &minus;
            </button>
            <span
              role="spinbutton"
              aria-label="Quantity"
              aria-valuenow={quantity}
              aria-valuemin={1}
              aria-valuemax={99}
              className="min-w-8 text-center text-sm font-medium"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              aria-label="Increase quantity"
              disabled={quantity >= 99}
              className="flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none disabled:opacity-40"
            >
              +
            </button>
          </div>

          <Button type="submit" size="lg" disabled={pending || !canSubmit} className="flex-1">
            {pending ? "Adding…" : "Add to Cart"}
          </Button>

          <button
            type="button"
            disabled={wishlistPending}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            onClick={async () => {
              setWishlistPending(true);
              // Optimistic, then settled from the server's answer.
              setWishlisted((value) => !value);
              try {
                setWishlisted(await toggleWishlist(productId, returnTo));
              } finally {
                setWishlistPending(false);
              }
            }}
            className={cn(
              "flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-line-strong transition-colors",
              wishlisted ? "bg-ink text-white" : "text-ink hover:bg-surface-muted",
            )}
          >
            <HeartIcon className="h-5 w-5" filled={wishlisted} />
          </button>
        </div>

        {state.message ? (
          <p
            role="status"
            className={cn("text-sm", state.ok ? "text-positive" : "text-sale")}
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
