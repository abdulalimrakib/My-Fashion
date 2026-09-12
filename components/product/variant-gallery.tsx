"use client";

import { ProductGallery } from "@/components/product/product-gallery";
import { useVariantSelection } from "@/components/product/variant-selection";

/**
 * Shows the photographs of the colour that is currently selected.
 *
 * `key` remounts the gallery on a colour change so its thumbnail selection
 * resets to the first shot of the new colour rather than pointing at an index
 * that belonged to the previous one.
 */
export function VariantGallery({ name }: { name: string }) {
  const { selected } = useVariantSelection();

  return (
    <ProductGallery
      key={selected?.id ?? "none"}
      images={selected?.images ?? []}
      name={selected ? `${name} in ${selected.color.name}` : name}
    />
  );
}
