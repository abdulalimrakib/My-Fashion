"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";

import { removeCartItem, updateCartQuantity } from "@/lib/actions/cart";
import { TrashIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";
import type { CartLine as CartLineData } from "@/lib/cart";

export function CartLine({ line }: { line: CartLineData }) {
  const [pending, startTransition] = useTransition();
  const image = line.product.images[0];

  return (
    <li className="flex gap-4 border-b border-line py-4 last:border-b-0" aria-busy={pending}>
      <Link
        href={`/product/${line.product.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:h-28 sm:w-28"
      >
        {image ? (
          <Image
            src={image.url}
            alt=""
            fill
            sizes="112px"
            className="object-contain p-2"
            placeholder="blur"
            blurDataURL={image.blurDataUrl}
          />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold sm:text-lg">
              <Link href={`/product/${line.product.slug}`} className="hover:underline">
                {line.product.name}
              </Link>
            </h3>
            <p className="text-xs text-ink-muted sm:text-sm">
              Size: <span className="text-ink">{line.size.name}</span>
            </p>
            <p className="text-xs text-ink-muted sm:text-sm">
              Color: <span className="text-ink">{line.color.name}</span>
            </p>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => removeCartItem(line.id))}
            aria-label={`Remove ${line.product.name} from cart`}
            className="shrink-0 rounded-full p-2 text-sale hover:bg-sale-soft disabled:opacity-50"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-bold sm:text-xl">
            {formatPrice(line.product.priceCents * line.quantity)}
          </p>

          <div className="flex items-center gap-1 rounded-full bg-surface-muted px-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => updateCartQuantity(line.id, -1))}
              aria-label={line.quantity === 1 ? "Remove item" : "Decrease quantity"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none disabled:opacity-50"
            >
              &minus;
            </button>
            <span className="min-w-6 text-center text-sm font-medium" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              disabled={pending || line.quantity >= 99}
              onClick={() => startTransition(() => updateCartQuantity(line.id, 1))}
              aria-label="Increase quantity"
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
