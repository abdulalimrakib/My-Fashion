import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductGallery } from "@/components/product/product-gallery";
import { ProductTabs } from "@/components/product/product-tabs";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ReviewForm } from "@/components/product/review-form";
import { ReviewList } from "@/components/product/review-list";
import { ProductCard } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PriceTag } from "@/components/ui/price-tag";
import { SectionHeading } from "@/components/ui/section-heading";
import { StarRating } from "@/components/ui/star-rating";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistProductIds } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { getProductBySlug, getProductReviews, getRelatedProducts } from "@/lib/products";

// No `generateStaticParams` here: the header reads the session cookie, which
// opts every route into dynamic rendering, so enumerating slugs at build time
// would run a query that produces nothing. Enabling `cacheComponents` (PPR)
// would be the way to get a prerendered shell back.

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const image = product.images[0];
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.description,
      images: image ? [{ url: image.url, width: image.width, height: image.height }] : undefined,
    },
  };
}

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Standard delivery arrives within 3–5 working days. A flat $15 delivery fee applies to every order.",
  },
  {
    q: "Can I return an item?",
    a: "Unworn items with tags attached can be returned within 30 days of delivery for a full refund.",
  },
  {
    q: "How do I choose the right size?",
    a: "Each product page lists the sizes stocked for that garment. If you are between sizes, the relaxed and oversized cuts run large — size down.",
  },
];

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related, user] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product),
    getCurrentUser(),
  ]);

  const wishlisted = user ? (await getWishlistProductIds(user.id)).has(product.id) : false;
  const returnTo = `/product/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((image) => image.url),
    offers: {
      "@type": "Offer",
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
    }),
  };

  return (
    <div className="container-page pb-16">
      <script
        type="application/ld+json"
        // Serialised from our own database rows, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.category.name, href: `/shop/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <ProductGallery images={product.images} name={product.name} />

        <div className="space-y-5">
          <h1 className="font-display text-2xl uppercase leading-tight sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>
          <StarRating value={product.rating} size="md" />
          <PriceTag
            priceCents={product.priceCents}
            compareAtPriceCents={product.compareAtPriceCents}
            size="lg"
          />
          <p className="text-sm leading-relaxed text-ink-muted">{product.description}</p>

          <PurchasePanel
            productId={product.id}
            colors={product.colors}
            sizes={product.sizes}
            returnTo={returnTo}
            initiallyWishlisted={wishlisted}
          />
        </div>
      </div>

      <div className="mt-12 sm:mt-16">
        <ProductTabs
          tabs={[
            {
              id: "details",
              label: "Product Details",
              content: (
                <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                  <p className="max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
                    {product.details}
                  </p>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-muted">Category</dt>
                      <dd className="font-medium">{product.category.name}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-muted">Dress style</dt>
                      <dd className="font-medium">
                        {product.styles.map((style) => style.name).join(", ") || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-muted">Sizes</dt>
                      <dd className="font-medium">
                        {product.sizes.map((size) => size.name).join(", ")}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Price</dt>
                      <dd className="font-medium">{formatPrice(product.priceCents)}</dd>
                    </div>
                  </dl>
                </div>
              ),
            },
            {
              id: "reviews",
              label: `Rating & Reviews (${product.reviewCount})`,
              content: (
                <div className="space-y-6">
                  <ReviewList reviews={reviews} />
                  <ReviewForm slug={product.slug} isSignedIn={Boolean(user)} />
                </div>
              ),
            },
            {
              id: "faqs",
              label: "FAQs",
              content: (
                <dl className="max-w-2xl space-y-5">
                  {FAQS.map((faq) => (
                    <div key={faq.q} className="border-b border-line pb-5 last:border-b-0">
                      <dt className="font-bold">{faq.q}</dt>
                      <dd className="mt-1.5 text-sm text-ink-muted">{faq.a}</dd>
                    </div>
                  ))}
                </dl>
              ),
            },
          ]}
        />
      </div>

      {related.length > 0 ? (
        <section className="mt-12 space-y-8 sm:mt-16">
          <SectionHeading>You might also like</SectionHeading>
          <ul className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} sizes="(min-width: 1024px) 22vw, 45vw" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
