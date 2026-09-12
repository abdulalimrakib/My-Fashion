import { redirect } from "next/navigation";

import { requireAdminOrRedirect } from "@/lib/auth";

export default async function AdminIndexPage() {
  await requireAdminOrRedirect("/admin");
  redirect("/admin/products");
}
