/**
 * Granting and revoking catalogue administration. Runs against the development
 * database; every account it creates is removed afterwards.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { getPrisma, hasDatabase } from "./helpers/db";
import { listUsers, NotRootAdminError, setUserAdmin } from "../lib/admin/user-service";
import type { SessionUser } from "../lib/auth";

const ROOT_EMAIL = "zz-root@example.test";

const root: SessionUser = {
  id: "actor-root",
  email: ROOT_EMAIL,
  name: "Root",
  isAdmin: true,
  isRootAdmin: true,
};
const plainAdmin: SessionUser = {
  id: "actor-admin",
  email: "zz-admin@example.test",
  name: "Admin",
  isAdmin: true,
  isRootAdmin: false,
};
const shopper: SessionUser = {
  id: "actor-shopper",
  email: "zz-shopper@example.test",
  name: null,
  isAdmin: false,
  isRootAdmin: false,
};

describe("administrator management", { skip: hasDatabase ? false : "DATABASE_URL is not set" }, () => {
  let prisma: Awaited<ReturnType<typeof getPrisma>>;
  const originalEnv = process.env.ROOT_ADMIN_EMAIL;
  const emails = {
    root: ROOT_EMAIL,
    shopper: "zz-user-shopper@example.test",
    admin: "zz-user-admin@example.test",
  };
  const ids: Record<keyof typeof emails, string> = { root: "", shopper: "", admin: "" };

  before(async () => {
    prisma = await getPrisma();
    process.env.ROOT_ADMIN_EMAIL = ROOT_EMAIL;

    for (const [key, email] of Object.entries(emails) as [keyof typeof emails, string][]) {
      const user = await prisma.user.upsert({
        where: { email },
        update: { isAdmin: key === "admin" },
        create: { email, name: `ZZ ${key}`, isAdmin: key === "admin" },
        select: { id: true },
      });
      ids[key] = user.id;
    }
  });

  after(async () => {
    if (originalEnv === undefined) delete process.env.ROOT_ADMIN_EMAIL;
    else process.env.ROOT_ADMIN_EMAIL = originalEnv;
    await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
    await prisma.$disconnect();
  });

  describe("authorization", () => {
    it("refuses a signed-out visitor", async () => {
      const result = await setUserAdmin(null, ids.shopper, true);
      assert.equal(result.ok, false);
      assert.match(result.message ?? "", /root administrator/i);
      await assert.rejects(() => listUsers(null), NotRootAdminError);
    });

    it("refuses an ordinary administrator", async () => {
      const result = await setUserAdmin(plainAdmin, ids.shopper, true);
      assert.equal(result.ok, false);
      assert.match(result.message ?? "", /root administrator/i);
      await assert.rejects(() => listUsers(plainAdmin), NotRootAdminError);
    });

    it("writes nothing when refused", async () => {
      await setUserAdmin(plainAdmin, ids.shopper, true);
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: ids.shopper },
        select: { isAdmin: true },
      });
      assert.equal(user.isAdmin, false);
    });

    it("refuses a shopper", async () => {
      const result = await setUserAdmin(shopper, ids.shopper, true);
      assert.equal(result.ok, false);
    });
  });

  describe("granting and revoking", () => {
    it("promotes a shopper", async () => {
      const result = await setUserAdmin(root, ids.shopper, true);
      assert.equal(result.ok, true);
      assert.match(result.message ?? "", /can now manage/);

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: ids.shopper },
        select: { isAdmin: true },
      });
      assert.equal(user.isAdmin, true);
    });

    it("demotes them again", async () => {
      const result = await setUserAdmin(root, ids.shopper, false);
      assert.equal(result.ok, true);
      assert.match(result.message ?? "", /no longer/);

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: ids.shopper },
        select: { isAdmin: true },
      });
      assert.equal(user.isAdmin, false);
    });

    it("is idempotent, and says so", async () => {
      const result = await setUserAdmin(root, ids.admin, true);
      assert.equal(result.ok, true);
      assert.match(result.message ?? "", /already manages/);
    });

    it("refuses to demote a root administrator", async () => {
      const result = await setUserAdmin(root, ids.root, false);
      assert.equal(result.ok, false);
      assert.match(result.message ?? "", /ROOT_ADMIN_EMAIL/);
    });

    it("reports an account that has gone", async () => {
      const result = await setUserAdmin(root, "no-such-user", true);
      assert.equal(result.ok, false);
      assert.match(result.message ?? "", /no longer exists/);
    });
  });

  describe("listing", () => {
    it("marks the root administrator even though its column is false", async () => {
      const stored = await prisma.user.findUniqueOrThrow({
        where: { id: ids.root },
        select: { isAdmin: true },
      });
      assert.equal(stored.isAdmin, false, "the column was never written");

      const users = await listUsers(root);
      const rootRow = users.find((user) => user.id === ids.root);
      assert.equal(rootRow?.isRootAdmin, true);
      assert.equal(rootRow?.isAdmin, true, "access is derived, not stored");
    });

    it("puts root administrators first, then admins", async () => {
      const users = await listUsers(root);
      const ours = users.filter((user) => Object.values(emails).includes(user.email));
      assert.equal(ours[0].email, emails.root);
      assert.equal(ours[1].email, emails.admin);
    });
  });
});
