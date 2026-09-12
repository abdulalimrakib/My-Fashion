/**
 * Shared setup for the tests that talk to a real database.
 *
 * Prisma is imported dynamically, after the environment file is loaded, because
 * `lib/prisma.ts` throws on import when `DATABASE_URL` is unset.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export async function getPrisma() {
  const { prisma } = await import("../../lib/prisma");
  return prisma;
}

/** Marks every row a test creates, so cleanup can never reach anything else. */
export const TEST_SLUG_PREFIX = "zz-test-";

export function testName(label: string): string {
  return `ZZ Test ${label} ${Math.random().toString(36).slice(2, 8)}`;
}
