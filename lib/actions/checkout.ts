"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { calculateTotals, getCart, lookupPromoCode } from "@/lib/cart";
import { generateOrderNumber } from "@/lib/orders";
import { validate, type FormState } from "@/lib/validation";

/**
 * Creates a real order row from the signed-in shopper's cart.
 *
 * No payment processor is configured, so the order is written at status
 * PENDING and no card details are collected. Everything else — stock of truth
 * for prices, the promo lookup, the address — is real and server-side.
 */
export async function placeOrder(_prev: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user) redirect("/login?next=/checkout&reason=checkout");

  const { values, fieldErrors } = validate(data, {
    fullName: { required: true, max: 120, label: "Full name" },
    email: { required: true, email: true, max: 160, label: "Email" },
    phone: { required: true, min: 6, max: 40, label: "Phone number" },
    address1: { required: true, max: 200, label: "Address" },
    address2: { max: 200, label: "Apartment or suite" },
    city: { required: true, max: 80, label: "City" },
    postalCode: { required: true, max: 20, label: "Postal code" },
    country: { required: true, max: 80, label: "Country" },
  });

  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors, message: "Check the highlighted fields." };
  }

  const lines = await getCart(user.id);
  if (lines.length === 0) {
    return { ok: false, message: "Your cart is empty." };
  }

  // Prices and the discount are recalculated here from the database; the
  // browser never gets to say what the order is worth.
  const promoCode = String(data.get("promoCode") ?? "").trim();
  const percentOff = await lookupPromoCode(promoCode);
  const totals = calculateTotals(lines, percentOff);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        email: values.email,
        fullName: values.fullName,
        phone: values.phone,
        address1: values.address1,
        address2: values.address2 || null,
        city: values.city,
        postalCode: values.postalCode,
        country: values.country,
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        shippingCents: totals.shippingCents,
        totalCents: totals.totalCents,
        promoCode: percentOff > 0 ? promoCode.toUpperCase() : null,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            name: line.product.name,
            slug: line.product.slug,
            imageUrl: line.product.images[0]?.url ?? "",
            colorName: line.color.name,
            sizeName: line.size.name,
            unitPriceCents: line.product.priceCents,
            quantity: line.quantity,
          })),
        },
      },
      select: { orderNumber: true },
    });

    await tx.cartItem.deleteMany({ where: { userId: user.id } });
    return created;
  });

  revalidatePath("/cart");
  revalidatePath("/account/orders");
  revalidatePath("/", "layout");
  redirect(`/checkout/success/${order.orderNumber}`);
}
