/**
 * Reads and writes behind the admin catalogue screens.
 *
 * The actor is passed in rather than read from the session here, so this module
 * has no dependency on the request and can be exercised directly by tests. The
 * server actions in `lib/actions/admin-products.ts` resolve the session and
 * hand it over; the admin check is repeated here so a future caller cannot
 * reach these writes without one.
 */
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { FALLBACK_BLUR_DATA_URL, imageAssetUrl } from "@/lib/images";
import {
  hasErrors,
  slugifyProductName,
  validateProductInput,
  variantImageField,
  type CatalogueReference,
  type FieldErrors,
  type ProductInput,
} from "@/lib/admin/product-input";

export type ServiceResult =
  | { ok: true; productId: string; slug: string }
  | { ok: false; message?: string; fieldErrors?: FieldErrors };

export class NotAuthorizedError extends Error {
  constructor() {
    super("You do not have permission to manage the catalogue.");
    this.name = "NotAuthorizedError";
  }
}

function isAdmin(actor: SessionUser | null | undefined): actor is SessionUser {
  return Boolean(actor?.isAdmin);
}

const NOT_AUTHORIZED_MESSAGE = "You do not have permission to manage the catalogue.";

const UNAUTHORIZED: ServiceResult = { ok: false, message: NOT_AUTHORIZED_MESSAGE };

/** Every reference list the admin form offers, in the order the shop shows them. */
export async function getCatalogueOptions() {
  const [categories, colors, sizes, styles] = await Promise.all([
    prisma.category.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    prisma.color.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true, slug: true, hex: true },
    }),
    prisma.size.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    prisma.dressStyle.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
  ]);
  return { categories, colors, sizes, styles };
}

export type CatalogueOptions = Awaited<ReturnType<typeof getCatalogueOptions>>;

function toReference(options: CatalogueOptions): CatalogueReference {
  return {
    categoryIds: new Set(options.categories.map((c) => c.id)),
    colorNames: new Map(options.colors.map((c) => [c.id, c.name])),
    sizeIds: new Set(options.sizes.map((s) => s.id)),
    styleIds: new Set(options.styles.map((s) => s.id)),
  };
}

/** Product rows for the admin list, with a thumbnail per colour. */
export async function listProductsForAdmin(actor: SessionUser | null) {
  if (!isAdmin(actor)) throw new NotAuthorizedError();

  return prisma.product.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      priceCents: true,
      compareAtPriceCents: true,
      updatedAt: true,
      category: { select: { name: true } },
      variants: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          color: { select: { name: true, hex: true, slug: true } },
          images: {
            orderBy: { position: "asc" },
            take: 1,
            select: { url: true, alt: true, blurDataUrl: true },
          },
        },
      },
    },
  });
}

export type AdminProductRow = Awaited<ReturnType<typeof listProductsForAdmin>>[number];

/** One product, shaped for the edit form. */
export async function getProductForAdmin(actor: SessionUser | null, productId: string) {
  if (!isAdmin(actor)) throw new NotAuthorizedError();

  return prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      details: true,
      priceCents: true,
      compareAtPriceCents: true,
      isNewArrival: true,
      isTopSelling: true,
      categoryId: true,
      styles: { select: { id: true } },
      sizes: { select: { id: true } },
      variants: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          colorId: true,
          images: {
            orderBy: { position: "asc" },
            take: 1,
            select: { id: true, url: true, alt: true, blurDataUrl: true, width: true, height: true },
          },
        },
      },
    },
  });
}

export type AdminProductDetail = NonNullable<Awaited<ReturnType<typeof getProductForAdmin>>>;

/** Slugs are unique; suffix until one is free, ignoring the product being edited. */
async function uniqueSlug(name: string, exceptProductId?: string): Promise<string> {
  const base = slugifyProductName(name) || "product";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const clash = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash || clash.id === exceptProductId) return candidate;
  }
  return `${base}-${Date.now()}`;
}

type ResolvedImage = {
  url: string;
  alt: string;
  blurDataUrl: string;
  width: number;
  height: number;
  assetId: string | null;
};

/**
 * Turns each variant's image reference into the row to write.
 *
 * An uploaded asset is re-read from `ImageAsset` rather than trusted from the
 * form, and a kept image has to already belong to this product — the ids arrive
 * from the browser, so neither can be taken at face value.
 */
async function resolveVariantImages(
  input: ProductInput,
  colorNames: ReadonlyMap<string, string>,
  productId: string | null,
): Promise<{ images: ResolvedImage[] } | { fieldErrors: FieldErrors }> {
  const assetIds = input.variants.map((v) => v.assetId).filter((id): id is string => Boolean(id));
  const imageIds = input.variants.map((v) => v.imageId).filter((id): id is string => Boolean(id));

  const [assets, existing] = await Promise.all([
    assetIds.length
      ? prisma.imageAsset.findMany({
          where: { id: { in: assetIds } },
          select: { id: true, width: true, height: true, blurDataUrl: true },
        })
      : Promise.resolve([]),
    imageIds.length && productId
      ? prisma.productImage.findMany({
          where: { id: { in: imageIds }, productId },
          select: { id: true, url: true, alt: true, blurDataUrl: true, width: true, height: true, assetId: true },
        })
      : Promise.resolve([]),
  ]);

  const assetById = new Map(assets.map((a) => [a.id, a]));
  const imageById = new Map(existing.map((i) => [i.id, i]));

  const fieldErrors: FieldErrors = {};
  const images: ResolvedImage[] = [];
  const productName = input.name.trim();

  input.variants.forEach((variant, index) => {
    const colorName = colorNames.get(variant.colorId) ?? "this";
    const alt = `${productName} in ${colorName} — product photograph on a plain background`;

    if (variant.assetId) {
      const asset = assetById.get(variant.assetId);
      if (!asset) {
        fieldErrors[variantImageField(index)] =
          "That upload could not be found. Please upload the image again.";
        return;
      }
      images.push({
        url: imageAssetUrl(asset.id),
        alt,
        blurDataUrl: asset.blurDataUrl || FALLBACK_BLUR_DATA_URL,
        width: asset.width,
        height: asset.height,
        assetId: asset.id,
      });
      return;
    }

    if (variant.imageId) {
      const image = imageById.get(variant.imageId);
      if (!image) {
        fieldErrors[variantImageField(index)] =
          "That image is no longer attached to this product. Please upload a new one.";
        return;
      }
      // The alt text is regenerated so it follows a renamed product or a
      // variant whose colour was changed.
      images.push({ ...image, alt });
      return;
    }

    fieldErrors[variantImageField(index)] = `Please upload an image for the ${colorName} variant.`;
  });

  return hasErrors(fieldErrors) ? { fieldErrors } : { images };
}

function scalarData(input: ProductInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    details: input.details.trim(),
    priceCents: input.priceCents!,
    compareAtPriceCents: input.compareAtPriceCents,
    isNewArrival: input.isNewArrival,
    isTopSelling: input.isTopSelling,
    categoryId: input.categoryId,
  };
}

/**
 * Image order across the whole product: variants in swatch order, so
 * `images[0]` — what a product card and a cart line show — is the first
 * colour's photograph.
 */
function imagePosition(variantIndex: number): number {
  return variantIndex * 100;
}

export async function createProduct(
  actor: SessionUser | null,
  input: ProductInput,
): Promise<ServiceResult> {
  if (!isAdmin(actor)) return UNAUTHORIZED;

  const options = await getCatalogueOptions();
  const reference = toReference(options);

  const fieldErrors = validateProductInput(input, reference);
  if (hasErrors(fieldErrors)) {
    return { ok: false, fieldErrors, message: "Check the highlighted fields." };
  }

  const resolved = await resolveVariantImages(input, reference.colorNames, null);
  if ("fieldErrors" in resolved) {
    return { ok: false, fieldErrors: resolved.fieldErrors, message: "Check the highlighted fields." };
  }

  const slug = await uniqueSlug(input.name);

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        slug,
        ...scalarData(input),
        styles: { connect: input.styleIds.map((id) => ({ id })) },
        sizes: { connect: input.sizeIds.map((id) => ({ id })) },
      },
      select: { id: true, slug: true },
    });

    for (const [index, variant] of input.variants.entries()) {
      const createdVariant = await tx.productVariant.create({
        data: { productId: created.id, colorId: variant.colorId, position: index },
        select: { id: true },
      });
      const image = resolved.images[index];
      await tx.productImage.create({
        data: {
          productId: created.id,
          variantId: createdVariant.id,
          position: imagePosition(index),
          ...image,
        },
      });
    }

    return created;
  });

  return { ok: true, productId: product.id, slug: product.slug };
}

export async function updateProduct(
  actor: SessionUser | null,
  productId: string,
  input: ProductInput,
): Promise<ServiceResult> {
  if (!isAdmin(actor)) return UNAUTHORIZED;

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, name: true },
  });
  if (!existing) return { ok: false, message: "That product no longer exists." };

  const options = await getCatalogueOptions();
  const reference = toReference(options);

  const fieldErrors = validateProductInput(input, reference);
  if (hasErrors(fieldErrors)) {
    return { ok: false, fieldErrors, message: "Check the highlighted fields." };
  }

  const resolved = await resolveVariantImages(input, reference.colorNames, productId);
  if ("fieldErrors" in resolved) {
    return { ok: false, fieldErrors: resolved.fieldErrors, message: "Check the highlighted fields." };
  }

  // The slug is part of every existing link to the product, so it only moves
  // when the name it was derived from actually changed.
  const slug =
    existing.name.trim() === input.name.trim()
      ? existing.slug
      : await uniqueSlug(input.name, productId);

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        slug,
        ...scalarData(input),
        styles: { set: input.styleIds.map((id) => ({ id })) },
        sizes: { set: input.sizeIds.map((id) => ({ id })) },
      },
    });

    const keptColorIds = input.variants.map((v) => v.colorId);

    // Removing a colour deletes its variant and, by cascade, its images.
    // `OrderItem` snapshots the colour name at purchase time, so historical
    // orders are unaffected. Cart lines referencing the colour are dropped,
    // because that combination can no longer be bought.
    const removed = await tx.productVariant.findMany({
      where: { productId, colorId: { notIn: keptColorIds } },
      select: { colorId: true },
    });
    if (removed.length > 0) {
      await tx.cartItem.deleteMany({
        where: { productId, colorId: { in: removed.map((r) => r.colorId) } },
      });
      await tx.productVariant.deleteMany({
        where: { productId, colorId: { notIn: keptColorIds } },
      });
    }

    for (const [index, variant] of input.variants.entries()) {
      const saved = await tx.productVariant.upsert({
        where: { productId_colorId: { productId, colorId: variant.colorId } },
        update: { position: index },
        create: { productId, colorId: variant.colorId, position: index },
        select: { id: true },
      });

      const image = resolved.images[index];
      const keptId = variant.imageId;

      // Anything not kept is replaced, so a variant never accumulates the
      // images it used to have.
      await tx.productImage.deleteMany({
        where: { variantId: saved.id, ...(keptId ? { id: { not: keptId } } : {}) },
      });

      if (keptId) {
        await tx.productImage.update({
          where: { id: keptId },
          data: { variantId: saved.id, position: imagePosition(index), alt: image.alt },
        });
      } else {
        await tx.productImage.create({
          data: {
            productId,
            variantId: saved.id,
            position: imagePosition(index),
            ...image,
          },
        });
      }
    }
  });

  return { ok: true, productId, slug };
}

export async function deleteProduct(
  actor: SessionUser | null,
  productId: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!isAdmin(actor)) return { ok: false, message: NOT_AUTHORIZED_MESSAGE };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, _count: { select: { orderItems: true } } },
  });
  if (!product) return { ok: false, message: "That product no longer exists." };

  // `OrderItem.productId` is `SetNull`, so deleting keeps the order line and its
  // copied name, price and colour. Say so rather than letting it look lossless.
  await prisma.product.delete({ where: { id: productId } });

  return {
    ok: true,
    message:
      product._count.orderItems > 0
        ? `${product.name} was deleted. Past orders keep their record of it.`
        : `${product.name} was deleted.`,
  };
}

/**
 * Uploaded files that were never attached to a product — the admin picked an
 * image and then abandoned the form. Old enough that nothing half-finished is
 * swept out from under an open tab.
 */
export async function pruneOrphanImageAssets(olderThanHours = 24): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const result = await prisma.imageAsset.deleteMany({
    where: { createdAt: { lt: cutoff }, images: { none: {} } },
  });
  return result.count;
}
