"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { validate, type FormState } from "@/lib/validation";

export async function submitReview(_prev: FormState, data: FormData): Promise<FormState> {
  const slug = String(data.get("slug") ?? "");

  const user = await requireUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/product/${slug}`)}&reason=review`);
  }

  const { values, fieldErrors } = validate(data, {
    body: { required: true, min: 10, max: 1000, label: "Review" },
  });

  const rating = Number(data.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    fieldErrors.rating = "Choose a rating between 1 and 5 stars.";
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors };
  }

  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return { ok: false, message: "That product no longer exists." };

  await prisma.review.create({
    data: {
      productId: product.id,
      userId: user.id,
      authorName: user.name?.trim() || user.email.split("@")[0],
      rating,
      body: values.body,
    },
  });

  // Keep the denormalised aggregate honest rather than letting the star display
  // drift away from the reviews underneath it.
  const stats = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: product.id },
    data: {
      rating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
      reviewCount: stats._count,
    },
  });

  revalidatePath(`/product/${slug}`);
  return { ok: true, message: "Thanks — your review has been published." };
}
