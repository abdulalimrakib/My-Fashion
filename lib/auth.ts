import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_DURATION_DAYS } from "@/lib/constants";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/**
 * Passwords are hashed with scrypt from `node:crypto`, so the project gains a
 * real KDF without adding a native dependency. The digest is stored as
 * "saltHex:hashHex".
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;

  const derived = await scryptAsync(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return timingSafeEqual(derived, expected);
}

/** Sessions are opaque random tokens; only their digest is persisted. */
function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { tokenHash: digest(token), userId, expiresAt },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: digest(token) } });
  }
  store.delete(SESSION_COOKIE);
}

export type SessionUser = { id: string; email: string; name: string | null };

/**
 * Deduplicated per request, so a layout and several nested components can each
 * ask who is signed in without repeating the query.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: digest(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

/**
 * Used by mutations that require an account. Returns null rather than throwing
 * so callers can redirect to sign-in with a `next` parameter.
 */
export async function requireUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}

/**
 * Page-level guard. Every protected page calls this for itself: a layout's
 * `redirect()` does not gate its pages, because layouts and pages render in
 * parallel, so a page that trusted the layout would still execute (and throw)
 * for signed-out visitors.
 */
export async function requireUserOrRedirect(
  next: string,
  reason = "account",
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}&reason=${reason}`);
  return user;
}
