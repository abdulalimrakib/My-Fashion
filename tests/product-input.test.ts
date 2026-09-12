/**
 * The rules a product has to satisfy. The wizard and the server action both run
 * this module, so these assertions cover the validation on both sides.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatCentsForInput,
  parsePriceToCents,
  slugifyProductName,
  validateProductDetails,
  validateProductInput,
  validateVariants,
  variantColorField,
  variantImageField,
  type CatalogueReference,
  type ProductInput,
} from "../lib/admin/product-input";

const catalogue: CatalogueReference = {
  categoryIds: new Set(["cat-tees"]),
  colorNames: new Map([
    ["col-black", "Black"],
    ["col-white", "White"],
    ["col-red", "Red"],
  ]),
  sizeIds: new Set(["size-s", "size-m"]),
  styleIds: new Set(["style-casual"]),
};

function validProduct(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    name: "Classic T-Shirt",
    description: "A relaxed cotton tee cut a little longer in the body.",
    details: "100% combed cotton jersey, pre-shrunk and garment washed.",
    categoryId: "cat-tees",
    priceCents: 12000,
    compareAtPriceCents: null,
    styleIds: ["style-casual"],
    sizeIds: ["size-s", "size-m"],
    isNewArrival: false,
    isTopSelling: false,
    variants: [{ colorId: "col-black", assetId: "asset-1", imageId: null }],
    ...overrides,
  };
}

describe("parsePriceToCents", () => {
  it("converts typed dollars to integer cents", () => {
    assert.equal(parsePriceToCents("120"), 12000);
    assert.equal(parsePriceToCents("99.50"), 9950);
    assert.equal(parsePriceToCents("$1,200"), 120000);
    assert.equal(parsePriceToCents(" 0.05 "), 5);
  });

  it("rejects anything that is not a plain amount", () => {
    assert.equal(parsePriceToCents(""), null);
    assert.equal(parsePriceToCents("abc"), null);
    assert.equal(parsePriceToCents("-10"), null);
    assert.equal(parsePriceToCents("1.005"), null);
    assert.equal(parsePriceToCents("1e5"), null);
  });

  it("round-trips through the form's display format", () => {
    assert.equal(formatCentsForInput(12000), "120");
    assert.equal(formatCentsForInput(9950), "99.50");
    assert.equal(formatCentsForInput(null), "");
    assert.equal(parsePriceToCents(formatCentsForInput(9950)), 9950);
  });
});

describe("slugifyProductName", () => {
  it("matches the shape of the seeded slugs", () => {
    assert.equal(slugifyProductName("T-shirt with Tape Details"), "t-shirt-with-tape-details");
    assert.equal(slugifyProductName("  Café  Crème  "), "cafe-creme");
    assert.equal(slugifyProductName("!!!"), "");
  });
});

describe("validateProductDetails", () => {
  it("passes a complete product", () => {
    assert.deepEqual(validateProductDetails(validProduct(), catalogue), {});
  });

  it("requires a product name", () => {
    const errors = validateProductDetails(validProduct({ name: "  " }), catalogue);
    assert.equal(errors.name, "Please enter a product name.");
  });

  it("reports an unparseable price in the admin's words", () => {
    const errors = validateProductDetails(validProduct({ priceCents: null }), catalogue);
    assert.equal(errors.price, "Please enter a valid price.");
  });

  it("rejects a price of zero", () => {
    const errors = validateProductDetails(validProduct({ priceCents: 0 }), catalogue);
    assert.match(errors.price, /greater than/);
  });

  it("rejects an original price that is not above the price", () => {
    const errors = validateProductDetails(
      validProduct({ priceCents: 12000, compareAtPriceCents: 12000 }),
      catalogue,
    );
    assert.match(errors.compareAtPrice, /higher than the price/);
  });

  it("requires a category that still exists", () => {
    assert.match(
      validateProductDetails(validProduct({ categoryId: "" }), catalogue).categoryId,
      /choose a category/i,
    );
    assert.match(
      validateProductDetails(validProduct({ categoryId: "cat-gone" }), catalogue).categoryId,
      /no longer exists/,
    );
  });

  it("requires at least one size", () => {
    const errors = validateProductDetails(validProduct({ sizeIds: [] }), catalogue);
    assert.match(errors.sizeIds, /at least one size/);
  });
});

describe("validateVariants", () => {
  it("accepts one colour with an image", () => {
    assert.deepEqual(validateVariants(validProduct(), catalogue), {});
  });

  it("accepts several colours, each with its own image", () => {
    const errors = validateVariants(
      validProduct({
        variants: [
          { colorId: "col-black", assetId: "asset-1", imageId: null },
          { colorId: "col-white", assetId: "asset-2", imageId: null },
          { colorId: "col-red", assetId: "asset-3", imageId: null },
        ],
      }),
      catalogue,
    );
    assert.deepEqual(errors, {});
  });

  it("requires at least one colour", () => {
    const errors = validateVariants(validProduct({ variants: [] }), catalogue);
    assert.equal(errors.variants, "Please add at least one color.");
  });

  it("rejects the same colour added twice", () => {
    const errors = validateVariants(
      validProduct({
        variants: [
          { colorId: "col-black", assetId: "asset-1", imageId: null },
          { colorId: "col-black", assetId: "asset-2", imageId: null },
        ],
      }),
      catalogue,
    );
    assert.equal(errors[variantColorField(1)], "This color has already been added.");
    assert.equal(errors[variantColorField(0)], undefined);
  });

  it("names the colour whose image is missing", () => {
    const errors = validateVariants(
      validProduct({
        variants: [
          { colorId: "col-black", assetId: "asset-1", imageId: null },
          { colorId: "col-white", assetId: null, imageId: null },
        ],
      }),
      catalogue,
    );
    assert.equal(errors[variantImageField(1)], "Please upload an image for the White variant.");
    assert.equal(errors[variantImageField(0)], undefined);
  });

  it("accepts an image kept from a previous save", () => {
    const errors = validateVariants(
      validProduct({
        variants: [{ colorId: "col-black", assetId: null, imageId: "img-1" }],
      }),
      catalogue,
    );
    assert.deepEqual(errors, {});
  });

  it("rejects a colour that no longer exists", () => {
    const errors = validateVariants(
      validProduct({ variants: [{ colorId: "col-gone", assetId: "a", imageId: null }] }),
      catalogue,
    );
    assert.match(errors[variantColorField(0)], /no longer exists/);
  });
});

describe("validateProductInput", () => {
  it("reports field and variant problems together", () => {
    const errors = validateProductInput(
      validProduct({ name: "", variants: [{ colorId: "col-red", assetId: null, imageId: null }] }),
      catalogue,
    );
    assert.equal(errors.name, "Please enter a product name.");
    assert.equal(errors[variantImageField(0)], "Please upload an image for the Red variant.");
  });
});
