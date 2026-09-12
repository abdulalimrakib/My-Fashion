/**
 * The data and action layer: who may write to the catalogue, what a valid
 * product produces in the database, and what the storefront reads back.
 *
 * These run against the development database configured in `.env.local`. Every
 * row is created by the test and deleted afterwards; nothing pre-existing is
 * touched.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";

import { getPrisma, hasDatabase, TEST_SLUG_PREFIX, testName } from "./helpers/db";
import {
  createProduct,
  deleteProduct,
  getCatalogueOptions,
  listProductsForAdmin,
  NotAuthorizedError,
  pruneOrphanImageAssets,
  updateProduct,
} from "../lib/admin/product-service";
import { variantColorField, variantImageField, type ProductInput } from "../lib/admin/product-input";
import { listProducts } from "../lib/products";
import { parseFilters } from "../lib/filters";
import type { SessionUser } from "../lib/auth";

const admin: SessionUser = {
  id: "test-admin",
  email: "admin@example.com",
  name: "Admin",
  isAdmin: true,
  isRootAdmin: false,
};
const shopper: SessionUser = {
  id: "test-shopper",
  email: "shopper@example.com",
  name: null,
  isAdmin: false,
  isRootAdmin: false,
};

describe("admin product service", { skip: hasDatabase ? false : "DATABASE_URL is not set" }, () => {
  let prisma: Awaited<ReturnType<typeof getPrisma>>;
  let options: Awaited<ReturnType<typeof getCatalogueOptions>>;
  let assetIds: string[] = [];
  const createdProductIds: string[] = [];

  /** A real 300x300 PNG, so the row is indistinguishable from a genuine upload. */
  const pngBytes = readFileSync("public/images/products/t-shirt-with-tape-details.png");

  async function makeAsset(): Promise<string> {
    const asset = await prisma.imageAsset.create({
      data: {
        mimeType: "image/png",
        bytes: pngBytes,
        byteSize: pngBytes.byteLength,
        width: 300,
        height: 300,
        blurDataUrl: "data:image/png;base64,iVBORw0KGgo=",
      },
      select: { id: true },
    });
    assetIds.push(asset.id);
    return asset.id;
  }

  function input(overrides: Partial<ProductInput> = {}): ProductInput {
    return {
      name: testName("Tee"),
      description: "A relaxed cotton tee cut a little longer in the body.",
      details: "100% combed cotton jersey, pre-shrunk and garment washed.",
      categoryId: options.categories[0].id,
      priceCents: 12000,
      compareAtPriceCents: null,
      styleIds: [options.styles[0].id],
      sizeIds: [options.sizes[0].id],
      isNewArrival: false,
      isTopSelling: false,
      variants: [],
      ...overrides,
    };
  }

  async function create(overrides: Partial<ProductInput> = {}) {
    const result = await createProduct(admin, input(overrides));
    if (result.ok) createdProductIds.push(result.productId);
    return result;
  }

  before(async () => {
    prisma = await getPrisma();
    options = await getCatalogueOptions();
  });

  after(async () => {
    // Products created here, plus anything left over from an interrupted run.
    await prisma.product.deleteMany({ where: { slug: { startsWith: TEST_SLUG_PREFIX } } });
    if (createdProductIds.length) {
      await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    }
    if (assetIds.length) {
      await prisma.imageAsset.deleteMany({ where: { id: { in: assetIds } } });
    }
    await prisma.$disconnect();
  });

  describe("authorization", () => {
    it("refuses a signed-out visitor", async () => {
      const result = await createProduct(null, input());
      assert.equal(result.ok, false);
      assert.match(result.ok === false ? (result.message ?? "") : "", /permission/i);
    });

    it("refuses a signed-in shopper who is not an administrator", async () => {
      const result = await createProduct(shopper, input());
      assert.equal(result.ok, false);
      assert.match(result.ok === false ? (result.message ?? "") : "", /permission/i);

      const update = await updateProduct(shopper, "any-id", input());
      assert.equal(update.ok, false);

      const removal = await deleteProduct(shopper, "any-id");
      assert.equal(removal.ok, false);
    });

    it("refuses to even list the catalogue for a non-administrator", async () => {
      await assert.rejects(() => listProductsForAdmin(shopper), NotAuthorizedError);
      await assert.rejects(() => listProductsForAdmin(null), NotAuthorizedError);
    });

    it("does not write anything when the caller is refused", async () => {
      const name = testName("Unauthorized");
      await createProduct(shopper, input({ name, variants: [] }));
      const found = await prisma.product.findFirst({ where: { name } });
      assert.equal(found, null);
    });
  });

  describe("creating a product", () => {
    it("stores one colour with its own image", async () => {
      const assetId = await makeAsset();
      const result = await create({
        variants: [{ colorId: options.colors[0].id, assetId, imageId: null }],
      });
      assert.equal(result.ok, true);
      if (!result.ok) return;

      const product = await prisma.product.findUnique({
        where: { id: result.productId },
        select: {
          name: true,
          priceCents: true,
          variants: {
            orderBy: { position: "asc" },
            select: { colorId: true, position: true, images: { select: { url: true, assetId: true } } },
          },
        },
      });

      assert.equal(product?.variants.length, 1);
      assert.equal(product?.variants[0].colorId, options.colors[0].id);
      assert.equal(product?.variants[0].images.length, 1);
      assert.equal(product?.variants[0].images[0].url, `/api/images/${assetId}`);
    });

    it("stores several colours against one product, each with its own image", async () => {
      const [a, b, c] = await Promise.all([makeAsset(), makeAsset(), makeAsset()]);
      const colors = options.colors.slice(0, 3);

      const result = await create({
        description: "One design, three colourways, one description.",
        variants: [
          { colorId: colors[0].id, assetId: a, imageId: null },
          { colorId: colors[1].id, assetId: b, imageId: null },
          { colorId: colors[2].id, assetId: c, imageId: null },
        ],
      });
      assert.equal(result.ok, true);
      if (!result.ok) return;

      const product = await prisma.product.findUnique({
        where: { id: result.productId },
        select: {
          description: true,
          variants: {
            orderBy: { position: "asc" },
            select: { colorId: true, position: true, images: { select: { url: true } } },
          },
        },
      });

      // The shared copy is stored once, not repeated per colour.
      assert.equal(product?.description, "One design, three colourways, one description.");
      assert.deepEqual(
        product?.variants.map((v) => v.colorId),
        colors.map((c) => c.id),
      );
      assert.deepEqual(
        product?.variants.map((v) => v.position),
        [0, 1, 2],
      );

      // Each colour points at a different file.
      const urls = product!.variants.map((v) => v.images[0]?.url);
      assert.equal(new Set(urls).size, 3);
      assert.deepEqual(urls, [`/api/images/${a}`, `/api/images/${b}`, `/api/images/${c}`]);
    });

    it("rejects the same colour twice", async () => {
      const [a, b] = await Promise.all([makeAsset(), makeAsset()]);
      const colorId = options.colors[0].id;

      const result = await createProduct(
        admin,
        input({
          variants: [
            { colorId, assetId: a, imageId: null },
            { colorId, assetId: b, imageId: null },
          ],
        }),
      );

      assert.equal(result.ok, false);
      assert.equal(
        result.ok === false ? result.fieldErrors?.[variantColorField(1)] : undefined,
        "This color has already been added.",
      );
    });

    it("rejects a colour with no image", async () => {
      const assetId = await makeAsset();
      const result = await createProduct(
        admin,
        input({
          variants: [
            { colorId: options.colors[0].id, assetId, imageId: null },
            { colorId: options.colors[1].id, assetId: null, imageId: null },
          ],
        }),
      );

      assert.equal(result.ok, false);
      assert.match(
        result.ok === false ? (result.fieldErrors?.[variantImageField(1)] ?? "") : "",
        /^Please upload an image for the .+ variant\.$/,
      );
    });

    it("rejects a product with no colours at all", async () => {
      const result = await createProduct(admin, input({ variants: [] }));
      assert.equal(result.ok, false);
      assert.equal(
        result.ok === false ? result.fieldErrors?.variants : undefined,
        "Please add at least one color.",
      );
    });

    it("rejects an invalid product before writing anything", async () => {
      const assetId = await makeAsset();
      const name = testName("Invalid");
      const result = await createProduct(
        admin,
        input({
          name,
          priceCents: null,
          variants: [{ colorId: options.colors[0].id, assetId, imageId: null }],
        }),
      );

      assert.equal(result.ok, false);
      assert.equal(result.ok === false ? result.fieldErrors?.price : undefined, "Please enter a valid price.");
      assert.equal(await prisma.product.findFirst({ where: { name } }), null);
    });

    it("rejects an image id that does not belong to an upload", async () => {
      const result = await createProduct(
        admin,
        input({ variants: [{ colorId: options.colors[0].id, assetId: "not-an-asset", imageId: null }] }),
      );
      assert.equal(result.ok, false);
      assert.match(
        result.ok === false ? (result.fieldErrors?.[variantImageField(0)] ?? "") : "",
        /upload the image again/i,
      );
    });
  });

  describe("editing a product", () => {
    it("adds a colour, removes one, and replaces an image", async () => {
      const [a, b] = await Promise.all([makeAsset(), makeAsset()]);
      const [black, white, red] = options.colors;

      const created = await create({
        variants: [
          { colorId: black.id, assetId: a, imageId: null },
          { colorId: white.id, assetId: b, imageId: null },
        ],
      });
      assert.equal(created.ok, true);
      if (!created.ok) return;

      const before = await prisma.productVariant.findMany({
        where: { productId: created.productId },
        orderBy: { position: "asc" },
        select: { colorId: true, images: { select: { id: true } } },
      });
      const keptImageId = before[0].images[0].id;

      // Keep black with the image it already has, drop white, add red with a
      // freshly uploaded file.
      const replacement = await makeAsset();
      const updated = await updateProduct(admin, created.productId, {
        ...input({ name: testName("Edited") }),
        variants: [
          { colorId: black.id, assetId: null, imageId: keptImageId },
          { colorId: red.id, assetId: replacement, imageId: null },
        ],
      });
      assert.equal(updated.ok, true);

      const after = await prisma.productVariant.findMany({
        where: { productId: created.productId },
        orderBy: { position: "asc" },
        select: { colorId: true, images: { select: { id: true, url: true } } },
      });

      assert.deepEqual(
        after.map((v) => v.colorId),
        [black.id, red.id],
      );
      assert.equal(after[0].images[0].id, keptImageId, "the kept image is not re-uploaded");
      assert.equal(after[1].images[0].url, `/api/images/${replacement}`);

      // The removed colour's images went with it.
      const orphans = await prisma.productImage.count({
        where: { productId: created.productId, variantId: null },
      });
      assert.equal(orphans, 0);
    });

    it("refuses to keep an image belonging to a different product", async () => {
      const [a, b] = await Promise.all([makeAsset(), makeAsset()]);
      const other = await create({ variants: [{ colorId: options.colors[0].id, assetId: a, imageId: null }] });
      const target = await create({ variants: [{ colorId: options.colors[1].id, assetId: b, imageId: null }] });
      assert.equal(other.ok && target.ok, true);
      if (!other.ok || !target.ok) return;

      const foreign = await prisma.productImage.findFirstOrThrow({
        where: { productId: other.productId },
        select: { id: true },
      });

      const result = await updateProduct(admin, target.productId, {
        ...input(),
        variants: [{ colorId: options.colors[1].id, assetId: null, imageId: foreign.id }],
      });

      assert.equal(result.ok, false);
      assert.match(
        result.ok === false ? (result.fieldErrors?.[variantImageField(0)] ?? "") : "",
        /no longer attached/i,
      );
    });

    it("still rejects a colour left without an image", async () => {
      const assetId = await makeAsset();
      const created = await create({
        variants: [{ colorId: options.colors[0].id, assetId, imageId: null }],
      });
      assert.equal(created.ok, true);
      if (!created.ok) return;

      const result = await updateProduct(admin, created.productId, {
        ...input(),
        variants: [
          { colorId: options.colors[0].id, assetId: null, imageId: null },
        ],
      });
      assert.equal(result.ok, false);
    });
  });

  describe("deleting a product", () => {
    it("keeps historical order lines intact", async () => {
      const assetId = await makeAsset();
      const created = await create({
        variants: [{ colorId: options.colors[0].id, assetId, imageId: null }],
      });
      assert.equal(created.ok, true);
      if (!created.ok) return;

      const user = await prisma.user.create({
        data: { email: `zz-test-${Date.now()}@example.com`, name: "ZZ Test" },
        select: { id: true },
      });
      const order = await prisma.order.create({
        data: {
          orderNumber: `ZZ-${Date.now()}`,
          userId: user.id,
          email: "zz@example.com",
          fullName: "ZZ Test",
          phone: "0000",
          address1: "1 Test Street",
          city: "Testville",
          postalCode: "0000",
          country: "Testland",
          subtotalCents: 12000,
          totalCents: 13500,
          items: {
            create: {
              productId: created.productId,
              name: "Doomed Tee",
              slug: created.slug,
              imageUrl: `/api/images/${assetId}`,
              colorName: options.colors[0].name,
              sizeName: options.sizes[0].name,
              unitPriceCents: 12000,
              quantity: 1,
            },
          },
        },
        select: { id: true },
      });

      try {
        const result = await deleteProduct(admin, created.productId);
        assert.equal(result.ok, true);
        assert.match(result.message ?? "", /Past orders/);

        const line = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } });
        assert.equal(line.name, "Doomed Tee");
        assert.equal(line.colorName, options.colors[0].name);
        assert.equal(line.productId, null, "the link is cleared, the record is kept");
      } finally {
        await prisma.order.deleteMany({ where: { id: order.id } });
        await prisma.user.deleteMany({ where: { id: user.id } });
      }
    });
  });

  describe("storefront reads", () => {
    it("finds the product by any of its colours, and not by one it lacks", async () => {
      const [a, b] = await Promise.all([makeAsset(), makeAsset()]);
      const [first, second] = options.colors;
      const absent = options.colors.find((c) => c.id !== first.id && c.id !== second.id)!;

      const created = await create({
        priceCents: 49900,
        variants: [
          { colorId: first.id, assetId: a, imageId: null },
          { colorId: second.id, assetId: b, imageId: null },
        ],
      });
      assert.equal(created.ok, true);
      if (!created.ok) return;

      const bySecond = await listProducts(parseFilters({ color: second.slug, min: "490", max: "500" }));
      assert.ok(
        bySecond.products.some((p) => p.id === created.productId),
        "filtering by a colour the product has finds it",
      );

      const byAbsent = await listProducts(parseFilters({ color: absent.slug, min: "490", max: "500" }));
      assert.ok(
        !byAbsent.products.some((p) => p.id === created.productId),
        "filtering by a colour it does not have excludes it",
      );
    });

    it("shows the first colour's photograph on the product card", async () => {
      const [a, b] = await Promise.all([makeAsset(), makeAsset()]);
      const created = await create({
        variants: [
          { colorId: options.colors[0].id, assetId: a, imageId: null },
          { colorId: options.colors[1].id, assetId: b, imageId: null },
        ],
      });
      assert.equal(created.ok, true);
      if (!created.ok) return;

      const product = await prisma.product.findUniqueOrThrow({
        where: { id: created.productId },
        select: { images: { orderBy: { position: "asc" }, take: 1, select: { url: true } } },
      });
      assert.equal(product.images[0].url, `/api/images/${a}`);
    });

    it("leaves the seeded catalogue intact", async () => {
      const seeded = await prisma.product.findUnique({
        where: { slug: "t-shirt-with-tape-details" },
        select: {
          name: true,
          variants: { select: { color: { select: { slug: true } }, images: { select: { id: true } } } },
        },
      });

      assert.ok(seeded, "the seeded product still exists");
      assert.ok(seeded!.variants.length >= 1, "it kept its colours through the migration");
      assert.ok(
        seeded!.variants.every((v) => v.images.length >= 1),
        "every migrated colour has an image",
      );
    });
  });

  describe("orphaned uploads", () => {
    it("keeps recent uploads and removes only unattached old ones", async () => {
      const recent = await makeAsset();
      const stale = await makeAsset();
      await prisma.imageAsset.update({
        where: { id: stale },
        data: { createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      });

      const attached = await makeAsset();
      await prisma.imageAsset.update({
        where: { id: attached },
        data: { createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      });
      const created = await create({
        variants: [{ colorId: options.colors[0].id, assetId: attached, imageId: null }],
      });
      assert.equal(created.ok, true);

      await pruneOrphanImageAssets();

      assert.ok(await prisma.imageAsset.findUnique({ where: { id: recent } }), "recent upload kept");
      assert.ok(await prisma.imageAsset.findUnique({ where: { id: attached } }), "attached upload kept");
      assert.equal(await prisma.imageAsset.findUnique({ where: { id: stale } }), null, "stale orphan removed");
      assetIds = assetIds.filter((id) => id !== stale);
    });
  });
});
