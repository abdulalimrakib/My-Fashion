"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/validation";

/** Returns the new saved state so the button can settle without a full reload. */
export async function toggleWishlist(productId: string, returnTo: string): Promise<boolean> {
  const user = await requireUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(safeRedirectPath(returnTo, "/shop"))}&reason=wishlist`,
    );
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  }

  revalidatePath("/wishlist");
  return !existing;
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const user = await requireUser();
  if (!user) redirect("/login?next=/wishlist&reason=wishlist");

  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
  revalidatePath("/wishlist");
}
