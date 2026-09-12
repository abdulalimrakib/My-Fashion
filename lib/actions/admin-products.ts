"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import {
  createProduct,
  deleteProduct,
  pruneOrphanImageAssets,
  updateProduct,
} from "@/lib/admin/product-service";
import { parsePriceToCents, type ProductInput, type VariantInput } from "@/lib/admin/product-input";
import { readString, type FormState } from "@/lib/validation";

/**
 * A catalogue edit changes the product page, every listing it appears in and
 * the home page rails, so all of them are invalidated. `"layout"` covers the
 * nested shop routes in one call.
 */
function revalidateCatalogue(slug?: string) {
  if (slug) revalidatePath(`/product/${slug}`);
  revalidatePath("/shop", "layout");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

function readIdList(data: FormData, key: string): string[] {
  return [...new Set(data.getAll(key).map((value) => String(value)).filter(Boolean))];
}

/**
 * The variants arrive as one JSON field rather than as indexed form keys: the
 * wizard already holds them as structured state, and a flat encoding would only
 * be taken apart again here. Every id in it is verified against the database by
 * the service before anything is written.
 */
function readVariants(data: FormData): VariantInput[] {
  const raw = readString(data, "variants");
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.slice(0, 50).map((entry): VariantInput => {
    const value = (entry ?? {}) as Record<string, unknown>;
    return {
      colorId: typeof value.colorId === "string" ? value.colorId : "",
      assetId: typeof value.assetId === "string" && value.assetId ? value.assetId : null,
      imageId: typeof value.imageId === "string" && value.imageId ? value.imageId : null,
    };
  });
}

function parseProductForm(data: FormData): ProductInput {
  const compareAt = readString(data, "compareAtPrice");

  return {
    name: readString(data, "name"),
    description: readString(data, "description"),
    details: readString(data, "details"),
    categoryId: readString(data, "categoryId"),
    priceCents: parsePriceToCents(readString(data, "price")),
    compareAtPriceCents: compareAt ? parsePriceToCents(compareAt) : null,
    styleIds: readIdList(data, "styleIds"),
    sizeIds: readIdList(data, "sizeIds"),
    isNewArrival: readString(data, "isNewArrival") === "on",
    isTopSelling: readString(data, "isTopSelling") === "on",
    variants: readVariants(data),
  };
}

export async function createProductAction(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  // Re-checked in the service too. A Server Action is a public POST endpoint:
  // rendering the form behind an admin page is not what keeps this closed.
  const actor = await requireAdmin();

  const result = await createProduct(actor, parseProductForm(data));
  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  await pruneOrphanImageAssets();
  revalidateCatalogue(result.slug);
  redirect(`/admin/products?saved=${encodeURIComponent(result.slug)}&action=created`);
}

export async function updateProductAction(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const actor = await requireAdmin();
  const productId = readString(data, "productId");

  const result = await updateProduct(actor, productId, parseProductForm(data));
  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  await pruneOrphanImageAssets();
  revalidateCatalogue(result.slug);
  redirect(`/admin/products?saved=${encodeURIComponent(result.slug)}&action=updated`);
}

export async function deleteProductAction(data: FormData): Promise<void> {
  const actor = await requireAdmin();
  const productId = readString(data, "productId");

  const result = await deleteProduct(actor, productId);
  revalidateCatalogue();

  redirect(
    result.ok
      ? "/admin/products?deleted=1"
      : `/admin/products?error=${encodeURIComponent(result.message ?? "That product could not be deleted.")}`,
  );
}
