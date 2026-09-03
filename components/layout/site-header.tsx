import Link from "next/link";
import { Suspense } from "react";

import { AccountMenu } from "@/components/layout/account-menu";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CartIndicator, CartIndicatorFallback } from "@/components/layout/cart-indicator";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PrimaryNav } from "@/components/layout/primary-nav";
import { SearchField } from "@/components/layout/search-field";
import { HeartIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 bg-surface">
      <AnnouncementBar />

      <div className="border-b border-line">
        <div className="container-page flex items-center gap-3 py-4 sm:gap-6">
          <MobileNav isSignedIn={Boolean(user)} />

          <Link href="/" className="font-display text-2xl uppercase tracking-tight sm:text-3xl">
            Shop.co
          </Link>

          <PrimaryNav />

          {/* Wide screens get the search inline; narrow screens get it on its own row. */}
          <div className="ml-auto hidden min-w-0 flex-1 md:block lg:ml-0">
            <SearchField />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden rounded-full p-2 text-ink hover:bg-surface-muted sm:block"
            >
              <HeartIcon className="h-6 w-6" />
            </Link>
            <Suspense fallback={<CartIndicatorFallback />}>
              <CartIndicator />
            </Suspense>
            <AccountMenu user={user} />
          </div>
        </div>

        <div className="container-page pb-3 md:hidden">
          <SearchField id="header-search-mobile" />
        </div>
      </div>
    </header>
  );
}
