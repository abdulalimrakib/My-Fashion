/**
 * Reads and writes behind `/admin/users`.
 *
 * Only a root administrator may change who is an administrator. As with
 * `product-service.ts`, the actor is passed in rather than read from the
 * request, so the rules can be tested directly, and the check is repeated here
 * rather than trusted from the caller.
 */
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { isRootAdminEmail, rootAdminEmails } from "@/lib/admin/roles";

export class NotRootAdminError extends Error {
  constructor() {
    super("Only a root administrator can change who manages the catalogue.");
    this.name = "NotRootAdminError";
  }
}

const NOT_ROOT_ADMIN_MESSAGE =
  "Only a root administrator can change who manages the catalogue.";

function isRootAdmin(actor: SessionUser | null | undefined): actor is SessionUser {
  return Boolean(actor?.isRootAdmin);
}

export type ManagedUser = {
  id: string;
  email: string;
  name: string | null;
  /** Effective access: the column, or a configured root administrator. */
  isAdmin: boolean;
  /** Fixed by `ROOT_ADMIN_EMAIL`; cannot be revoked from the UI. */
  isRootAdmin: boolean;
  createdAt: Date;
  orderCount: number;
};

/** Every account, administrators first, so the list answers "who has access?". */
export async function listUsers(actor: SessionUser | null): Promise<ManagedUser[]> {
  if (!isRootAdmin(actor)) throw new NotRootAdminError();

  const users = await prisma.user.findMany({
    orderBy: [{ isAdmin: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  const managed = users.map((user) => {
    const rootAdmin = isRootAdminEmail(user.email);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin || rootAdmin,
      isRootAdmin: rootAdmin,
      createdAt: user.createdAt,
      orderCount: user._count.orders,
    };
  });

  // A root administrator whose column is still false would otherwise sort in
  // with the shoppers, which reads as though they had no access.
  return managed.sort((a, b) => {
    if (a.isRootAdmin !== b.isRootAdmin) return a.isRootAdmin ? -1 : 1;
    if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export type UserResult = { ok: boolean; message?: string };

/**
 * Grants or revokes catalogue administration.
 *
 * A root administrator cannot be demoted: their access comes from
 * `ROOT_ADMIN_EMAIL`, so clearing the column would change nothing and the
 * button would lie about what it had done.
 */
export async function setUserAdmin(
  actor: SessionUser | null,
  userId: string,
  isAdmin: boolean,
): Promise<UserResult> {
  if (!isRootAdmin(actor)) return { ok: false, message: NOT_ROOT_ADMIN_MESSAGE };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, isAdmin: true },
  });
  if (!user) return { ok: false, message: "That account no longer exists." };

  const label = user.name?.trim() || user.email;

  if (isRootAdminEmail(user.email)) {
    return {
      ok: false,
      message: `${label} is a root administrator, set by ROOT_ADMIN_EMAIL. Change that environment variable to alter this.`,
    };
  }

  if (user.isAdmin === isAdmin) {
    return {
      ok: true,
      message: isAdmin
        ? `${label} already manages the catalogue.`
        : `${label} already has no admin access.`,
    };
  }

  await prisma.user.update({ where: { id: user.id }, data: { isAdmin } });

  // Revoking takes effect on the next request because `getCurrentUser` reads
  // the column each time; no session needs to be destroyed.
  return {
    ok: true,
    message: isAdmin
      ? `${label} can now manage the catalogue.`
      : `${label} can no longer manage the catalogue.`,
  };
}

/** Surfaced on the page so a misconfigured deployment is obvious, not silent. */
export function configuredRootAdmins(actor: SessionUser | null): string[] {
  if (!isRootAdmin(actor)) throw new NotRootAdminError();
  return rootAdminEmails();
}
