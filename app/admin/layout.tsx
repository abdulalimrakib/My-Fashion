import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getCurrentUser } from "@/lib/auth";

/**
 * Chrome only. Like `app/account/layout.tsx`, authorization lives on each page
 * rather than here: layouts and pages render in parallel, so a redirect in a
 * layout does not stop its page from running.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Nav only. `/admin/users` guards itself; hiding the link is a courtesy.
  const user = await getCurrentUser();

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin" }]} />

      <div className="grid gap-8 lg:grid-cols-[12rem_1fr] lg:items-start">
        <nav aria-label="Admin" className="lg:sticky lg:top-40">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            <li>
              <Link
                href="/admin/products"
                className="block whitespace-nowrap rounded-lg px-4 py-2.5 text-sm hover:bg-surface-muted"
              >
                Products
              </Link>
            </li>
            {user?.isRootAdmin ? (
              <li>
                <Link
                  href="/admin/users"
                  className="block whitespace-nowrap rounded-lg px-4 py-2.5 text-sm hover:bg-surface-muted"
                >
                  Administrators
                </Link>
              </li>
            ) : null}
            <li>
              <Link
                href="/shop"
                className="block whitespace-nowrap rounded-lg px-4 py-2.5 text-sm text-ink-muted hover:bg-surface-muted"
              >
                View storefront
              </Link>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
