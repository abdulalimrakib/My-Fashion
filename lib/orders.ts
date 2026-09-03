import { randomInt } from "node:crypto";

import { prisma } from "@/lib/prisma";

/** Human-readable and unguessable enough to quote over the phone. */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const suffix = randomInt(0, 1_000_000).toString().padStart(6, "0");
  return `SC-${year}-${suffix}`;
}

const orderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  email: true,
  fullName: true,
  phone: true,
  address1: true,
  address2: true,
  city: true,
  postalCode: true,
  country: true,
  subtotalCents: true,
  discountCents: true,
  shippingCents: true,
  totalCents: true,
  promoCode: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      colorName: true,
      sizeName: true,
      unitPriceCents: true,
      quantity: true,
    },
  },
};

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderForUser>>>;

/** Scoped by user id, so an order number alone never exposes someone else's order. */
export async function getOrderForUser(orderNumber: string, userId: string) {
  return prisma.order.findFirst({
    where: { orderNumber, userId },
    select: orderSelect,
  });
}

export async function listOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      createdAt: true,
      items: {
        select: { id: true, name: true, imageUrl: true, quantity: true },
      },
    },
  });
}
