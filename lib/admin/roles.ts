/**
 * Who is permanently an administrator.
 *
 * `User.isAdmin` is an ordinary database column, which leaves one bootstrapping
 * problem — the first administrator cannot be granted from inside the
 * application — and one failure mode: a bad write, a restored backup or a
 * demotion by another admin can leave nobody able to get back in.
 *
 * `ROOT_ADMIN_EMAIL` closes both. The accounts it names are treated as
 * administrators whatever the column says, so the answer is *derived* rather
 * than stored and there is no state to corrupt. They are also the only accounts
 * allowed to grant or revoke administration for anyone else.
 *
 * Read at call time rather than at module load, so the value can come from the
 * deployment environment rather than only from the build.
 */
export function rootAdminEmails(): string[] {
  return (process.env.ROOT_ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isRootAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return rootAdminEmails().includes(email.trim().toLowerCase());
}

/** True once at least one root administrator is configured. */
export function hasRootAdmin(): boolean {
  return rootAdminEmails().length > 0;
}
