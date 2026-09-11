import type { Metadata } from "next";

import { ProductCard } from "@/components/product/product-card";
import { WishlistRemoveButton } from "@/components/product/wishlist-remove-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getWishlist } from "@/lib/cart";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false },
};

export default async function WishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container-page pb-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
        <EmptyState
          title="Sign in to see your wishlist"
          description="Saved items are tied to your account so they follow you between devices."
          image={{ src: "/images/states/empty-cart.png", alt: "" }}
          action={{ href: "/login?next=/wishlist&reason=wishlist", label: "Sign in" }}
        />
      </div>
    );
  }

  const items = await getWishlist(user.id);

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
      <h1 className="font-display text-3xl uppercase sm:text-4xl">Wishlist</h1>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Tap the heart on any product to keep it here for later."
          image={{ src: "/images/states/empty-cart.png", alt: "" }}
          action={{ href: "/shop", label: "Browse products" }}
        />
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="relative">
              <WishlistRemoveButton productId={item.product.id} name={item.product.name} />
              <ProductCard product={item.product} sizes="(min-width: 1024px) 22vw, 45vw" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
