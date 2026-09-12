"use client";

import { useState } from "react";

import { setUserAdminAction } from "@/lib/actions/admin-users";
import { Button } from "@/components/ui/button";

/**
 * Grants or revokes administration for one account.
 *
 * Revoking asks first: it takes effect on the very next request that account
 * makes, and there is no undo beyond granting it back.
 */
export function AdminToggle({
  userId,
  label,
  isAdmin,
  isRootAdmin,
  isSelf,
}: {
  userId: string;
  label: string;
  isAdmin: boolean;
  isRootAdmin: boolean;
  isSelf: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (isRootAdmin) {
    return (
      <p className="text-xs text-ink-subtle">
        {isSelf ? "That is you." : "Fixed by ROOT_ADMIN_EMAIL."}
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <form action={setUserAdminAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="isAdmin" value="true" />
        <Button type="submit" variant="secondary" size="sm">
          Make admin
        </Button>
      </form>
    );
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-sale"
        onClick={() => setConfirming(true)}
      >
        Remove admin
      </Button>
    );
  }

  return (
    <form action={setUserAdminAction} className="flex items-center gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="isAdmin" value="false" />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-sale"
        aria-label={`Confirm removing admin access for ${label}`}
      >
        Confirm
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </form>
  );
}
