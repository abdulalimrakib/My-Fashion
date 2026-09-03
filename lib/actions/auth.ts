"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { safeRedirectPath, validate, type FormState } from "@/lib/validation";

const MIN_PASSWORD = 8;

export async function register(_prev: FormState, data: FormData): Promise<FormState> {
  const { values, fieldErrors } = validate(data, {
    name: { required: true, max: 80, label: "Name" },
    email: { required: true, email: true, max: 160, label: "Email" },
    password: { required: true, min: MIN_PASSWORD, max: 200, label: "Password" },
  });

  if (values.password && values.password !== data.get("confirmPassword")) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors };
  }

  const email = values.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, fieldErrors: { email: "An account with this email already exists." } };
  }

  const user = await prisma.user.create({
    data: { email, name: values.name, passwordHash: await hashPassword(values.password) },
    select: { id: true },
  });

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect(safeRedirectPath(data.get("next") as string | null, "/account"));
}

export async function signIn(_prev: FormState, data: FormData): Promise<FormState> {
  const { values, fieldErrors } = validate(data, {
    email: { required: true, email: true, label: "Email" },
    password: { required: true, label: "Password" },
  });

  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { email: values.email.toLowerCase() },
    select: { id: true, passwordHash: true },
  });

  // One message for both branches, so this cannot be used to discover which
  // email addresses have accounts.
  const valid = user && (await verifyPassword(values.password, user.passwordHash));
  if (!valid) {
    return { ok: false, message: "Email or password is incorrect." };
  }

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect(safeRedirectPath(data.get("next") as string | null, "/account"));
}

export async function signOut(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
