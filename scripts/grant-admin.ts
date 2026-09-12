/**
 * Grants or revokes catalogue administration for an existing account.
 *
 * The usual way to do this is `/admin/users`, signed in as the account named by
 * `ROOT_ADMIN_EMAIL`. This script is the way in when that is not available —
 * the variable is unset, or the account it names has not been registered yet.
 * Run it against the environment whose database you mean to change.
 *
 *   npm run admin:grant -- someone@example.com
 *   npm run admin:grant -- someone@example.com --revoke
 */
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { isRootAdminEmail, rootAdminEmails } from "../lib/admin/roles";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

const args = process.argv.slice(2);
const revoke = args.includes("--revoke");
const email = args.find((arg) => !arg.startsWith("--"))?.trim().toLowerCase();

if (!email) {
  console.error("Usage: npm run admin:grant -- <email> [--revoke]");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, isAdmin: true },
  });

  if (!user) {
    console.error(`No account with the email ${email}. Register it first, then run this again.`);
    process.exitCode = 1;
    return;
  }

  // Their access is derived from the environment, so the column is not what
  // decides it and changing the column here would be misleading.
  if (isRootAdminEmail(user.email)) {
    console.log(
      revoke
        ? `${user.email} is a root administrator (ROOT_ADMIN_EMAIL). Remove it from that variable to revoke access.`
        : `${user.email} is already a root administrator (ROOT_ADMIN_EMAIL).`,
    );
    return;
  }

  if (user.isAdmin === !revoke) {
    console.log(`${user.email} is already ${revoke ? "not an administrator" : "an administrator"}.`);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { isAdmin: !revoke } });
  console.log(
    revoke
      ? `${user.email} can no longer manage the catalogue.`
      : `${user.email} can now manage the catalogue at /admin/products.`,
  );

  const roots = rootAdminEmails();
  if (roots.length === 0) {
    console.log(
      "\nROOT_ADMIN_EMAIL is not set, so nobody can grant administration from " +
        "/admin/users. Set it to avoid needing this script again.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
