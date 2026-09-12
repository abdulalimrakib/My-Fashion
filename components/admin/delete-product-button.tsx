"use client";

import { useState } from "react";

import { deleteProductAction } from "@/lib/actions/admin-products";
import { Button } from "@/components/ui/button";

/**
 * Two-step delete. Removing a product is not reversible from the UI, so the
 * button asks once before it submits.
 */
export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-sale"
        onClick={() => setConfirming(true)}
      >
        Delete
      </Button>
    );
  }

  return (
    <form action={deleteProductAction} className="flex items-center gap-1">
      <input type="hidden" name="productId" value={productId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-sale"
        aria-label={`Confirm deleting ${productName}`}
      >
        Confirm
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </form>
  );
}
