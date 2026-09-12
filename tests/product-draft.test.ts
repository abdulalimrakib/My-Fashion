/**
 * The admin wizard's behaviour: adding and removing colours, attaching images,
 * and which step a mistake keeps the administrator on.
 *
 * `components/admin/product-form.tsx` is a view over these transitions, so what
 * is asserted here is what the form does.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addVariant,
  draftFromProduct,
  draftToInput,
  emptyDraft,
  nextAvailableColorId,
  removeVariant,
  setVariantColor,
  setVariantImage,
  validateStep,
  type ProductDraft,
  type VariantImage,
} from "../lib/admin/product-draft";
import {
  variantColorField,
  variantImageField,
  type CatalogueReference,
} from "../lib/admin/product-input";

const COLORS = [
  { id: "col-black", name: "Black" },
  { id: "col-white", name: "White" },
  { id: "col-red", name: "Red" },
];

const catalogue: CatalogueReference = {
  categoryIds: new Set(["cat-tees"]),
  colorNames: new Map(COLORS.map((c) => [c.id, c.name])),
  sizeIds: new Set(["size-s"]),
  styleIds: new Set(["style-casual"]),
};

function uploaded(id: string): VariantImage {
  return { assetId: id, imageId: null, url: `/api/images/${id}`, blurDataUrl: "data:image/png;base64,AA==" };
}

function completeDetails(): ProductDraft {
  return {
    ...emptyDraft(),
    name: "Classic T-Shirt",
    description: "A relaxed cotton tee cut a little longer in the body.",
    details: "100% combed cotton jersey.",
    categoryId: "cat-tees",
    price: "120",
    sizeIds: ["size-s"],
  };
}

describe("adding colours", () => {
  it("starts with none and adds one at a time", () => {
    let draft = emptyDraft();
    assert.equal(draft.variants.length, 0);

    draft = addVariant(draft, "col-black");
    draft = addVariant(draft, "col-white");

    assert.deepEqual(
      draft.variants.map((v) => v.colorId),
      ["col-black", "col-white"],
    );
  });

  it("offers the first colour the product does not already use", () => {
    let draft = emptyDraft();
    assert.equal(nextAvailableColorId(draft, COLORS), "col-black");

    draft = addVariant(draft, "col-black");
    assert.equal(nextAvailableColorId(draft, COLORS), "col-white");

    draft = addVariant(draft, "col-white");
    draft = addVariant(draft, "col-red");
    assert.equal(nextAvailableColorId(draft, COLORS), null);
  });

  it("gives every row its own key so they are independent", () => {
    let draft = addVariant(emptyDraft(), "col-black");
    draft = addVariant(draft, "col-white");
    assert.notEqual(draft.variants[0].key, draft.variants[1].key);
  });
});

describe("images per colour", () => {
  it("attaches an image to one colour without touching the others", () => {
    let draft = addVariant(addVariant(emptyDraft(), "col-black"), "col-white");
    const [black, white] = draft.variants;

    draft = setVariantImage(draft, black.key, uploaded("asset-black"));

    assert.equal(draft.variants[0].image?.assetId, "asset-black");
    assert.equal(draft.variants[1].image, null);
    assert.equal(draft.variants[1].key, white.key);
  });

  it("replaces an image on the same row", () => {
    let draft = addVariant(emptyDraft(), "col-black");
    const key = draft.variants[0].key;

    draft = setVariantImage(draft, key, uploaded("asset-one"));
    draft = setVariantImage(draft, key, uploaded("asset-two"));

    assert.equal(draft.variants[0].image?.assetId, "asset-two");
  });

  it("removes an image, leaving the colour in place", () => {
    let draft = addVariant(emptyDraft(), "col-black");
    const key = draft.variants[0].key;

    draft = setVariantImage(draft, key, uploaded("asset-one"));
    draft = setVariantImage(draft, key, null);

    assert.equal(draft.variants.length, 1);
    assert.equal(draft.variants[0].image, null);
  });
});

describe("removing colours", () => {
  it("removes only the row asked for, and keeps the others' images", () => {
    let draft = addVariant(addVariant(addVariant(emptyDraft(), "col-black"), "col-white"), "col-red");
    draft = setVariantImage(draft, draft.variants[0].key, uploaded("a-black"));
    draft = setVariantImage(draft, draft.variants[1].key, uploaded("a-white"));
    draft = setVariantImage(draft, draft.variants[2].key, uploaded("a-red"));

    draft = removeVariant(draft, draft.variants[1].key);

    assert.deepEqual(
      draft.variants.map((v) => v.colorId),
      ["col-black", "col-red"],
    );
    assert.deepEqual(
      draft.variants.map((v) => v.image?.assetId),
      ["a-black", "a-red"],
    );
  });

  it("frees the colour to be added again", () => {
    let draft = addVariant(emptyDraft(), "col-black");
    draft = removeVariant(draft, draft.variants[0].key);
    assert.equal(nextAvailableColorId(draft, COLORS), "col-black");
  });
});

describe("step validation", () => {
  it("blocks step one until the shared details are complete", () => {
    assert.ok(Object.keys(validateStep("details", emptyDraft(), catalogue)).length > 0);
    assert.deepEqual(validateStep("details", completeDetails(), catalogue), {});
  });

  it("blocks step two with no colours", () => {
    const errors = validateStep("colors", completeDetails(), catalogue);
    assert.equal(errors.variants, "Please add at least one color.");
  });

  it("blocks step two when a colour has no image", () => {
    let draft = addVariant(completeDetails(), "col-black");
    draft = addVariant(draft, "col-white");
    draft = setVariantImage(draft, draft.variants[0].key, uploaded("a-black"));

    const errors = validateStep("colors", draft, catalogue);
    assert.equal(errors[variantImageField(1)], "Please upload an image for the White variant.");
  });

  it("blocks step two when the same colour is chosen twice", () => {
    let draft = addVariant(completeDetails(), "col-black");
    draft = addVariant(draft, "col-white");
    draft = setVariantColor(draft, draft.variants[1].key, "col-black");
    draft = setVariantImage(draft, draft.variants[0].key, uploaded("a-1"));
    draft = setVariantImage(draft, draft.variants[1].key, uploaded("a-2"));

    assert.equal(validateStep("colors", draft, catalogue)[variantColorField(1)], "This color has already been added.");
  });

  it("passes review once every colour has an image", () => {
    let draft = completeDetails();
    for (const color of COLORS) draft = addVariant(draft, color.id);
    draft.variants.forEach((variant, index) => {
      draft = setVariantImage(draft, variant.key, uploaded(`asset-${index}`));
    });

    assert.deepEqual(validateStep("review", draft, catalogue), {});
  });

  it("re-checks step one at review, so a later edit cannot slip through", () => {
    let draft = completeDetails();
    draft = addVariant(draft, "col-black");
    draft = setVariantImage(draft, draft.variants[0].key, uploaded("a"));
    draft = { ...draft, price: "not a price" };

    assert.equal(validateStep("review", draft, catalogue).price, "Please enter a valid price.");
  });
});

describe("editing a saved product", () => {
  it("loads its colours and keeps their existing images", () => {
    const draft = draftFromProduct({
      name: "Classic T-Shirt",
      description: "A relaxed cotton tee.",
      details: "Cotton jersey.",
      categoryId: "cat-tees",
      priceCents: 12000,
      compareAtPriceCents: 16000,
      isNewArrival: true,
      isTopSelling: false,
      styles: [{ id: "style-casual" }],
      sizes: [{ id: "size-s" }],
      variants: [
        {
          colorId: "col-black",
          images: [{ id: "img-black", url: "/api/images/a", blurDataUrl: "data:image/png;base64,AA==" }],
        },
        {
          colorId: "col-white",
          images: [{ id: "img-white", url: "/api/images/b", blurDataUrl: "data:image/png;base64,AA==" }],
        },
      ],
    });

    assert.equal(draft.price, "120");
    assert.equal(draft.compareAtPrice, "160");
    assert.equal(draft.isNewArrival, true);

    const input = draftToInput(draft);
    assert.deepEqual(input.variants, [
      { colorId: "col-black", assetId: null, imageId: "img-black" },
      { colorId: "col-white", assetId: null, imageId: "img-white" },
    ]);
    assert.deepEqual(validateStep("review", draft, catalogue), {});
  });
});
