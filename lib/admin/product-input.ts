/**
 * The shape of a product as the admin form sends it, and the rules it has to
 * satisfy.
 *
 * Both the wizard and the server action validate against this module, so the
 * inline feedback an administrator sees while typing is produced by the same
 * code that decides whether the write is allowed. The wizard cannot be the only
 * check — a Server Action is a public POST endpoint — and it should not be a
 * second, drifting copy of one either.
 */

export type VariantInput = {
  colorId: string;
  /** `ImageAsset` id for a file uploaded in this session. */
  assetId: string | null;
  /** `ProductImage` id kept from a previous save, when editing. */
  imageId: string | null;
};

export type ProductInput = {
  name: string;
  description: string;
  details: string;
  categoryId: string;
  /** What the shopper pays. */
  priceCents: number | null;
  /** The struck-through original, or null when the product is not on sale. */
  compareAtPriceCents: number | null;
  styleIds: string[];
  sizeIds: string[];
  isNewArrival: boolean;
  isTopSelling: boolean;
  variants: VariantInput[];
};

export type FieldErrors = Record<string, string>;

/** Field-error keys for a variant row, so the form and the action agree. */
export function variantColorField(index: number): string {
  return `variant.${index}.color`;
}

export function variantImageField(index: number): string {
  return `variant.${index}.image`;
}

export const MAX_VARIANTS = 12;

/**
 * Money is integer cents everywhere in this project; this is where the admin's
 * typed dollars become them. Returns null for anything that is not a
 * non-negative amount with at most two decimal places.
 */
export function parsePriceToCents(value: string): number | null {
  const trimmed = value.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatCentsForInput(cents: number | null): string {
  if (cents === null) return "";
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

/** URL-safe slug derived from the product name, matching the seeded catalogue. */
export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** What the validator needs to know about the catalogue to check references. */
export type CatalogueReference = {
  categoryIds: ReadonlySet<string>;
  colorNames: ReadonlyMap<string, string>;
  styleIds: ReadonlySet<string>;
  sizeIds: ReadonlySet<string>;
};

/** Validates the product's own fields — everything except the colour variants. */
export function validateProductDetails(input: ProductInput, catalogue: CatalogueReference) {
  const fieldErrors: FieldErrors = {};

  const name = input.name.trim();
  if (!name) fieldErrors.name = "Please enter a product name.";
  else if (name.length < 3) fieldErrors.name = "Product name must be at least 3 characters.";
  else if (name.length > 120) fieldErrors.name = "Product name must be 120 characters or fewer.";

  const description = input.description.trim();
  if (!description) fieldErrors.description = "Please enter a short description.";
  else if (description.length < 20) {
    fieldErrors.description = "The short description must be at least 20 characters.";
  } else if (description.length > 500) {
    fieldErrors.description = "The short description must be 500 characters or fewer.";
  }

  const details = input.details.trim();
  if (!details) fieldErrors.details = "Please enter the full product details.";
  else if (details.length > 4000) {
    fieldErrors.details = "Product details must be 4000 characters or fewer.";
  }

  if (!input.categoryId) fieldErrors.categoryId = "Please choose a category.";
  else if (!catalogue.categoryIds.has(input.categoryId)) {
    fieldErrors.categoryId = "That category no longer exists.";
  }

  if (input.priceCents === null) fieldErrors.price = "Please enter a valid price.";
  else if (input.priceCents <= 0) fieldErrors.price = "Please enter a price greater than $0.";
  else if (input.priceCents > 100_000_00) fieldErrors.price = "Please enter a price under $100,000.";

  if (input.compareAtPriceCents !== null) {
    if (input.compareAtPriceCents <= 0) {
      fieldErrors.compareAtPrice = "Please enter a valid original price.";
    } else if (input.priceCents !== null && input.compareAtPriceCents <= input.priceCents) {
      // Otherwise the derived discount badge would read 0% or negative.
      fieldErrors.compareAtPrice = "The original price must be higher than the price.";
    }
  }

  if (input.sizeIds.length === 0) fieldErrors.sizeIds = "Please choose at least one size.";
  else if (input.sizeIds.some((id) => !catalogue.sizeIds.has(id))) {
    fieldErrors.sizeIds = "One of those sizes no longer exists.";
  }

  if (input.styleIds.some((id) => !catalogue.styleIds.has(id))) {
    fieldErrors.styleIds = "One of those dress styles no longer exists.";
  }

  return fieldErrors;
}

/**
 * Validates the colour variants: at least one, no colour twice, and an image
 * for every one of them.
 */
export function validateVariants(input: ProductInput, catalogue: CatalogueReference) {
  const fieldErrors: FieldErrors = {};

  if (input.variants.length === 0) {
    fieldErrors.variants = "Please add at least one color.";
    return fieldErrors;
  }
  if (input.variants.length > MAX_VARIANTS) {
    fieldErrors.variants = `A product can have at most ${MAX_VARIANTS} colors.`;
    return fieldErrors;
  }

  const seen = new Set<string>();
  input.variants.forEach((variant, index) => {
    if (!variant.colorId) {
      fieldErrors[variantColorField(index)] = "Please choose a color.";
    } else if (!catalogue.colorNames.has(variant.colorId)) {
      fieldErrors[variantColorField(index)] = "That color no longer exists.";
    } else if (seen.has(variant.colorId)) {
      fieldErrors[variantColorField(index)] = "This color has already been added.";
    } else {
      seen.add(variant.colorId);
    }

    if (!variant.assetId && !variant.imageId) {
      const colorName = catalogue.colorNames.get(variant.colorId);
      fieldErrors[variantImageField(index)] = colorName
        ? `Please upload an image for the ${colorName} variant.`
        : "Please upload an image for this variant.";
    }
  });

  return fieldErrors;
}

/** Both halves, for the final submit. */
export function validateProductInput(
  input: ProductInput,
  catalogue: CatalogueReference,
): FieldErrors {
  return {
    ...validateProductDetails(input, catalogue),
    ...validateVariants(input, catalogue),
  };
}

export function hasErrors(fieldErrors: FieldErrors): boolean {
  return Object.keys(fieldErrors).length > 0;
}
