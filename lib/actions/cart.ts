"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { safeRedirectPath, type FormState } from "@/lib/validation";

/** Cart changes affect the header badge, so both paths are revalidated. */
function revalidateCart() {
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

/**
 * Adding to the cart requires a real account. When there is no session the
 * shopper is sent to sign-in with a `next` parameter and returns to the product
 * they were looking at.
 */
export async function addToCart(_prev: FormState, data: FormData): Promise<FormState> {
  const productId = String(data.get("productId") ?? "");
  const colorId = String(data.get("colorId") ?? "");
  const sizeId = String(data.get("sizeId") ?? "");
  const quantity = Math.max(1, Math.min(99, Number(data.get("quantity") ?? 1)));
  const returnTo = safeRedirectPath(data.get("returnTo") as string | null, "/shop");

  const user = await requireUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}&reason=cart`);
  }

  if (!productId) return { ok: false, message: "That product is no longer available." };
  if (!colorId) return { ok: false, message: "Choose a colour first." };
  if (!sizeId) return { ok: false, message: "Choose a size first." };

  // Verify the variant actually belongs to the product rather than trusting the
  // ids that came back from the form.
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      colors: { some: { id: colorId } },
      sizes: { some: { id: sizeId } },
    },
    select: { id: true, name: true },
  });
  if (!product) {
    return { ok: false, message: "That colour and size combination is not available." };
  }

  await prisma.cartItem.upsert({
    where: {
      userId_productId_colorId_sizeId: { userId: user.id, productId, colorId, sizeId },
    },
    update: { quantity: { increment: quantity } },
    create: { userId: user.id, productId, colorId, sizeId, quantity },
  });

  revalidateCart();
  return { ok: true, message: `${product.name} added to your cart.` };
}

export async function updateCartQuantity(itemId: string, delta: number): Promise<void> {
  const user = await requireUser();
  if (!user) redirect("/login?next=/cart&reason=cart");

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, userId: user.id },
    select: { id: true, quantity: true },
  });
  if (!item) return;

  const next = item.quantity + delta;
  if (next < 1) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.min(99, next) },
    });
  }

  revalidateCart();
}

export async function removeCartItem(itemId: string): Promise<void> {
  const user = await requireUser();
  if (!user) redirect("/login?next=/cart&reason=cart");

  await prisma.cartItem.deleteMany({ where: { id: itemId, userId: user.id } });
  revalidateCart();
}
