/**
 * The admin product form's state, as plain data and pure transitions.
 *
 * Keeping "add a colour", "remove a colour", "attach an image" and "is this
 * step complete" out of the component means the wizard's behaviour can be
 * tested directly, and that the form and the server action agree on what a
 * product is: `draftToInput` produces exactly the shape
 * `validateProductInput` checks.
 */
import {
  formatCentsForInput,
  parsePriceToCents,
  validateProductDetails,
  validateVariants,
  type CatalogueReference,
  type FieldErrors,
  type ProductInput,
} from "@/lib/admin/product-input";

export type VariantImage = {
  /** Set when the file was uploaded in this session. */
  assetId: string | null;
  /** Set when the image was already saved on this variant. */
  imageId: string | null;
  url: string;
  blurDataUrl: string;
};

export type DraftVariant = {
  /** Stable across reorders and colour changes, so React keeps the file input. */
  key: string;
  colorId: string;
  image: VariantImage | null;
};

export type ProductDraft = {
  name: string;
  description: string;
  details: string;
  categoryId: string;
  /** Dollars as typed, converted to cents only when the draft is submitted. */
  price: string;
  compareAtPrice: string;
  styleIds: string[];
  sizeIds: string[];
  isNewArrival: boolean;
  isTopSelling: boolean;
  variants: DraftVariant[];
};

let keyCounter = 0;

function nextKey(): string {
  keyCounter += 1;
  return `variant-${keyCounter}`;
}

export function emptyDraft(): ProductDraft {
  return {
    name: "",
    description: "",
    details: "",
    categoryId: "",
    price: "",
    compareAtPrice: "",
    styleIds: [],
    sizeIds: [],
    isNewArrival: false,
    isTopSelling: false,
    variants: [],
  };
}

/** Shape of a saved product, as the edit page loads it. */
export type SavedProduct = {
  name: string;
  description: string;
  details: string;
  categoryId: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  isNewArrival: boolean;
  isTopSelling: boolean;
  styles: { id: string }[];
  sizes: { id: string }[];
  variants: {
    colorId: string;
    images: { id: string; url: string; blurDataUrl: string }[];
  }[];
};

export function draftFromProduct(product: SavedProduct): ProductDraft {
  return {
    name: product.name,
    description: product.description,
    details: product.details,
    categoryId: product.categoryId,
    price: formatCentsForInput(product.priceCents),
    compareAtPrice: formatCentsForInput(product.compareAtPriceCents),
    styleIds: product.styles.map((style) => style.id),
    sizeIds: product.sizes.map((size) => size.id),
    isNewArrival: product.isNewArrival,
    isTopSelling: product.isTopSelling,
    variants: product.variants.map((variant) => {
      const image = variant.images[0];
      return {
        key: nextKey(),
        colorId: variant.colorId,
        image: image
          ? { assetId: null, imageId: image.id, url: image.url, blurDataUrl: image.blurDataUrl }
          : null,
      };
    }),
  };
}

export function draftToInput(draft: ProductDraft): ProductInput {
  return {
    name: draft.name,
    description: draft.description,
    details: draft.details,
    categoryId: draft.categoryId,
    priceCents: parsePriceToCents(draft.price),
    compareAtPriceCents: draft.compareAtPrice ? parsePriceToCents(draft.compareAtPrice) : null,
    styleIds: draft.styleIds,
    sizeIds: draft.sizeIds,
    isNewArrival: draft.isNewArrival,
    isTopSelling: draft.isTopSelling,
    variants: draft.variants.map((variant) => ({
      colorId: variant.colorId,
      assetId: variant.image?.assetId ?? null,
      imageId: variant.image?.imageId ?? null,
    })),
  };
}

/** The first colour the product does not already use, or null when none is left. */
export function nextAvailableColorId(
  draft: ProductDraft,
  colors: { id: string }[],
): string | null {
  const used = new Set(draft.variants.map((variant) => variant.colorId));
  return colors.find((color) => !used.has(color.id))?.id ?? null;
}

/**
 * Adds a colour row. Defaults to the first unused colour so the administrator
 * never has to clear a duplicate the form chose for them.
 */
export function addVariant(draft: ProductDraft, colorId: string): ProductDraft {
  return { ...draft, variants: [...draft.variants, { key: nextKey(), colorId, image: null }] };
}

export function removeVariant(draft: ProductDraft, key: string): ProductDraft {
  return { ...draft, variants: draft.variants.filter((variant) => variant.key !== key) };
}

function mapVariant(
  draft: ProductDraft,
  key: string,
  update: (variant: DraftVariant) => DraftVariant,
): ProductDraft {
  return {
    ...draft,
    variants: draft.variants.map((variant) => (variant.key === key ? update(variant) : variant)),
  };
}

export function setVariantColor(draft: ProductDraft, key: string, colorId: string): ProductDraft {
  return mapVariant(draft, key, (variant) => ({ ...variant, colorId }));
}

export function setVariantImage(
  draft: ProductDraft,
  key: string,
  image: VariantImage | null,
): ProductDraft {
  return mapVariant(draft, key, (variant) => ({ ...variant, image }));
}

export const STEPS = ["details", "colors", "review"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_LABELS: Record<Step, string> = {
  details: "Product information",
  colors: "Colors and images",
  review: "Review",
};

/**
 * The errors that block leaving a step. The review step re-checks both, so a
 * field edited after passing step one cannot slip through.
 */
export function validateStep(
  step: Step,
  draft: ProductDraft,
  catalogue: CatalogueReference,
): FieldErrors {
  const input = draftToInput(draft);
  switch (step) {
    case "details":
      return validateProductDetails(input, catalogue);
    case "colors":
      return validateVariants(input, catalogue);
    case "review":
      return { ...validateProductDetails(input, catalogue), ...validateVariants(input, catalogue) };
  }
}
