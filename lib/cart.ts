import { prisma } from "@/lib/prisma";
import { SHIPPING_CENTS } from "@/lib/constants";

const lineSelect = {
  id: true,
  quantity: true,
  color: { select: { id: true, name: true, hex: true } },
  size: { select: { id: true, name: true } },
  product: {
    select: {
      id: true,
      slug: true,
      name: true,
      priceCents: true,
      compareAtPriceCents: true,
      images: {
        take: 1,
        orderBy: { position: "asc" as const },
        select: { url: true, alt: true, blurDataUrl: true },
      },
    },
  },
};

export type CartLine = Awaited<ReturnType<typeof getCart>>[number];

export async function getCart(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: lineSelect,
  });
}

export async function getCartCount(userId: string): Promise<number> {
  const result = await prisma.cartItem.aggregate({
    where: { userId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export type CartTotals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  itemCount: number;
};

/**
 * Totals are always recomputed from the line items and the promo percentage.
 * Nothing that affects the amount charged is read back from the client.
 */
export function calculateTotals(lines: CartLine[], percentOff = 0): CartTotals {
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.product.priceCents * line.quantity,
    0,
  );
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const discountCents = Math.round((subtotalCents * percentOff) / 100);
  const shippingCents = subtotalCents > 0 ? SHIPPING_CENTS : 0;

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: subtotalCents - discountCents + shippingCents,
    itemCount,
  };
}

/** Returns the discount percentage for a code, or 0 if it is unknown or expired. */
export async function lookupPromoCode(code: string): Promise<number> {
  if (!code) return 0;
  const promo = await prisma.promoCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!promo || !promo.isActive) return 0;
  if (promo.expiresAt && promo.expiresAt < new Date()) return 0;
  return promo.percentOff;
}

export async function getWishlist(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          priceCents: true,
          compareAtPriceCents: true,
          rating: true,
          reviewCount: true,
          images: {
            take: 1,
            orderBy: { position: "asc" },
            select: { url: true, alt: true, blurDataUrl: true, width: true, height: true },
          },
        },
      },
    },
  });
}

export async function getWishlistProductIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });
  return new Set(rows.map((r) => r.productId));
}
