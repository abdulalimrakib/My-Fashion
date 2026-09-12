"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRootAdmin } from "@/lib/auth";
import { setUserAdmin } from "@/lib/admin/user-service";
import { readString } from "@/lib/validation";

/**
 * Grants or revokes catalogue administration from `/admin/users`.
 *
 * Re-checks the session for itself: a Server Action is a public POST endpoint,
 * and rendering the button only for root administrators is not what keeps this
 * closed.
 */
export async function setUserAdminAction(data: FormData): Promise<void> {
  const actor = await requireRootAdmin();
  const userId = readString(data, "userId");
  const isAdmin = readString(data, "isAdmin") === "true";

  const result = await setUserAdmin(actor, userId, isAdmin);

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");

  const key = result.ok ? "saved" : "error";
  redirect(`/admin/users?${key}=${encodeURIComponent(result.message ?? "")}`);
}
