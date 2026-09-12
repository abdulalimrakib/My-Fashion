"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { ProductVariantDetail } from "@/lib/products";

type VariantSelection = {
  variants: ProductVariantDetail[];
  selected: ProductVariantDetail | null;
  selectVariant: (variantId: string) => void;
};

const VariantSelectionContext = createContext<VariantSelection | null>(null);

/**
 * Holds which colourway the shopper is looking at.
 *
 * The swatches and the photographs sit in different columns of the product
 * page's grid with server-rendered copy between them, so the choice lives in a
 * context rather than in either component. Everything in between stays a Server
 * Component — only the two ends of the wire are client code.
 */
export function VariantSelectionProvider({
  variants,
  children,
}: {
  variants: ProductVariantDetail[];
  children: ReactNode;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");

  const value = useMemo<VariantSelection>(
    () => ({
      variants,
      selected: variants.find((variant) => variant.id === selectedId) ?? variants[0] ?? null,
      selectVariant: setSelectedId,
    }),
    [variants, selectedId],
  );

  return (
    <VariantSelectionContext.Provider value={value}>{children}</VariantSelectionContext.Provider>
  );
}

export function useVariantSelection(): VariantSelection {
  const value = useContext(VariantSelectionContext);
  if (!value) {
    throw new Error("useVariantSelection must be used inside a VariantSelectionProvider.");
  }
  return value;
}
