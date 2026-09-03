"use server";

import { prisma } from "@/lib/prisma";
import { validate, type FormState } from "@/lib/validation";

/**
 * Stores the address. No mail provider is configured, so nothing is actually
 * sent — the confirmation copy says only that the address was saved.
 */
export async function subscribeToNewsletter(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const { values, fieldErrors } = validate(data, {
    email: { required: true, email: true, max: 160, label: "Email" },
  });

  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: fieldErrors.email };
  }

  const email = values.email.toLowerCase();
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  return { ok: true, message: "You're on the list. We'll be in touch." };
}
