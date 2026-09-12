import type { Metadata } from "next";

import { AdminToggle } from "@/components/admin/admin-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRootAdminOrRedirect } from "@/lib/auth";
import { configuredRootAdmins, listUsers } from "@/lib/admin/user-service";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Administrators",
  robots: { index: false },
};

export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  const root = await requireRootAdminOrRedirect("/admin/users");
  const [users, searchParams] = await Promise.all([listUsers(root), props.searchParams]);
  const rootEmails = configuredRootAdmins(root);

  const saved = typeof searchParams.saved === "string" ? searchParams.saved : null;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const adminCount = users.filter((user) => user.isAdmin).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase sm:text-4xl">Administrators</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {adminCount} of {users.length} {users.length === 1 ? "account" : "accounts"} can manage
          the catalogue.
        </p>
      </div>

      {saved ? (
        <p role="status" className="rounded-2xl border border-line bg-surface-muted px-4 py-3 text-sm">
          {saved}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-2xl bg-sale-soft px-4 py-3 text-sm font-medium text-sale">
          {error}
        </p>
      ) : null}

      <div className="rounded-2xl border border-line p-5 text-sm">
        <h2 className="font-bold">Root administrators</h2>
        <p className="mt-1.5 text-ink-muted">
          Set by the <code className="font-mono text-xs">ROOT_ADMIN_EMAIL</code> environment
          variable. These accounts always have access, even if the database says otherwise, and
          they are the only ones that can change this list.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {rootEmails.map((email) => (
            <li key={email} className="rounded-full bg-surface-muted px-3 py-1 font-mono text-xs">
              {email}
            </li>
          ))}
        </ul>
      </div>

      {users.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          description="Once shoppers register, you can give any of them access to the catalogue from here."
        />
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-line p-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="flex flex-wrap items-center gap-2 font-bold leading-snug">
                  <span className="truncate">{user.name?.trim() || user.email}</span>
                  {user.isRootAdmin ? (
                    <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-medium text-on-ink">
                      Root admin
                    </span>
                  ) : user.isAdmin ? (
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium">
                      Admin
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-sm text-ink-muted">{user.email}</p>
                <p className="text-xs text-ink-subtle">
                  Joined {formatDate(user.createdAt)} · {user.orderCount}{" "}
                  {user.orderCount === 1 ? "order" : "orders"}
                </p>
              </div>

              <AdminToggle
                userId={user.id}
                label={user.name?.trim() || user.email}
                isAdmin={user.isAdmin}
                isRootAdmin={user.isRootAdmin}
                isSelf={user.id === root.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
