import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const LINKS = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
];

/**
 * Chrome only. Authorization lives on each page instead of here: layouts and
 * pages render in parallel, so a layout redirect does not stop its page from
 * executing, and it would also flatten every page's `next` path to `/account`.
 */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Account" }]} />

      <div className="grid gap-8 lg:grid-cols-[14rem_1fr] lg:items-start">
        <nav aria-label="Account" className="lg:sticky lg:top-40">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block whitespace-nowrap rounded-lg px-4 py-2.5 text-sm hover:bg-surface-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
