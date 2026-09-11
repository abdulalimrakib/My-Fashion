"use client";

import { useTransition } from "react";

import { removeFromWishlist } from "@/lib/actions/wishlist";
import { TrashIcon } from "@/components/ui/icons";

export function WishlistRemoveButton({ productId, name }: { productId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => removeFromWishlist(productId))}
      aria-label={`Remove ${name} from wishlist`}
      className="absolute right-2 top-2 z-10 rounded-full bg-surface/90 p-2 text-sale shadow-sm hover:bg-sale-soft disabled:opacity-50"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
