import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { PAGE_SIZE, isCollectionSlug, type CollectionSlug } from "@/lib/constants";
import type { ProductFilters } from "@/lib/filters";
import type { Prisma } from "@/app/generated/prisma/client";

/** Everything a product card needs, and nothing more. */
const cardSelect = {
  id: true,
  slug: true,
  name: true,
  priceCents: true,
  compareAtPriceCents: true,
  rating: true,
  reviewCount: true,
  images: {
    orderBy: { position: "asc" },
    take: 1,
    select: { url: true, alt: true, blurDataUrl: true, width: true, height: true },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

const detailSelect = {
  ...cardSelect,
  description: true,
  details: true,
  categoryId: true,
  category: { select: { slug: true, name: true } },
  images: {
    orderBy: { position: "asc" },
    select: { id: true, url: true, alt: true, blurDataUrl: true, width: true, height: true },
  },
  colors: { orderBy: { position: "asc" }, select: { id: true, slug: true, name: true, hex: true } },
  sizes: { orderBy: { position: "asc" }, select: { id: true, slug: true, name: true } },
  styles: { orderBy: { position: "asc" }, select: { slug: true, name: true } },
} satisfies Prisma.ProductSelect;

export type ProductDetail = Prisma.ProductGetPayload<{ select: typeof detailSelect }>;

/**
 * Collections are derived rather than stored: "on sale" is simply every product
 * with a higher original price, so it can never drift out of date.
 */
function collectionWhere(collection: CollectionSlug): Prisma.ProductWhereInput {
  switch (collection) {
    case "new-arrivals":
      return { isNewArrival: true };
    case "top-selling":
      return { isTopSelling: true };
    case "on-sale":
      return { compareAtPriceCents: { not: null } };
  }
}

function buildWhere(
  filters: ProductFilters,
  collection?: CollectionSlug,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    priceCents: { gte: filters.minCents, lte: filters.maxCents },
  };

  if (collection) Object.assign(where, collectionWhere(collection));
  if (filters.categories.length) where.category = { slug: { in: filters.categories } };
  if (filters.styles.length) where.styles = { some: { slug: { in: filters.styles } } };
  if (filters.colors.length) where.colors = { some: { slug: { in: filters.colors } } };
  if (filters.sizes.length) where.sizes = { some: { slug: { in: filters.sizes } } };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { category: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }

  return where;
}

function buildOrderBy(sort: ProductFilters["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }, { name: "asc" }];
    case "price-asc":
      return [{ priceCents: "asc" }, { name: "asc" }];
    case "price-desc":
      return [{ priceCents: "desc" }, { name: "asc" }];
    case "rating":
      return [{ rating: "desc" }, { reviewCount: "desc" }];
    case "featured":
    default:
      return [{ isTopSelling: "desc" }, { rating: "desc" }, { name: "asc" }];
  }
}

export type ProductListResult = {
  products: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
};

export async function listProducts(
  filters: ProductFilters,
  collection?: CollectionSlug,
): Promise<ProductListResult> {
  const where = buildWhere(filters, collection);
  const total = await prisma.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const products = await prisma.product.findMany({
    where,
    select: cardSelect,
    orderBy: buildOrderBy(filters.sort),
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return { products, total, page, pageCount };
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  return prisma.product.findUnique({ where: { slug }, select: detailSelect });
});

export async function getProductReviews(productId: string, take = 6) {
  return prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, authorName: true, rating: true, body: true, createdAt: true },
  });
}

/** Same category first, then anything else, never the product being viewed. */
export async function getRelatedProducts(product: {
  id: string;
  categoryId: string;
}): Promise<ProductCardData[]> {
  const sameCategory = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    select: cardSelect,
    orderBy: [{ rating: "desc" }],
    take: 4,
  });

  if (sameCategory.length >= 4) return sameCategory;

  const filler = await prisma.product.findMany({
    where: { id: { notIn: [product.id, ...sameCategory.map((p) => p.id)] } },
    select: cardSelect,
    orderBy: [{ isTopSelling: "desc" }, { rating: "desc" }],
    take: 4 - sameCategory.length,
  });

  return [...sameCategory, ...filler];
}

export async function getCollectionProducts(
  collection: CollectionSlug,
  take = 4,
): Promise<ProductCardData[]> {
  return prisma.product.findMany({
    where: collectionWhere(collection),
    select: cardSelect,
    orderBy: [{ rating: "desc" }, { name: "asc" }],
    take,
  });
}

export const getFilterFacets = cache(async () => {
  const [categories, styles, colors, sizes] = await Promise.all([
    prisma.category.findMany({ orderBy: { position: "asc" }, select: { slug: true, name: true } }),
    prisma.dressStyle.findMany({ orderBy: { position: "asc" }, select: { slug: true, name: true } }),
    prisma.color.findMany({
      orderBy: { position: "asc" },
      select: { slug: true, name: true, hex: true },
    }),
    prisma.size.findMany({ orderBy: { position: "asc" }, select: { slug: true, name: true } }),
  ]);
  return { categories, styles, colors, sizes };
});

export type FilterFacets = Awaited<ReturnType<typeof getFilterFacets>>;

/**
 * Resolves a `/shop/[category]` segment to either a stored category or a
 * derived collection, so both share one route.
 */
export async function resolveShopSegment(segment: string) {
  if (isCollectionSlug(segment)) {
    const { COLLECTIONS } = await import("@/lib/constants");
    const collection = COLLECTIONS.find((c) => c.slug === segment)!;
    return { kind: "collection" as const, slug: collection.slug, name: collection.name };
  }

  const category = await prisma.category.findUnique({
    where: { slug: segment },
    select: { slug: true, name: true },
  });
  if (!category) return null;

  return { kind: "category" as const, slug: category.slug, name: category.name };
}

export async function getTestimonials() {
  return prisma.testimonial.findMany({ orderBy: { position: "asc" } });
}

/** Representative product image for each dress-style card on the home page. */
export async function getDressStyleCards() {
  const styles = await prisma.dressStyle.findMany({
    orderBy: { position: "asc" },
    select: {
      slug: true,
      name: true,
      products: {
        take: 1,
        orderBy: { rating: "desc" },
        select: {
          name: true,
          images: {
            take: 1,
            orderBy: { position: "asc" },
            select: { url: true, blurDataUrl: true },
          },
        },
      },
    },
  });

  return styles.map((style) => ({
    slug: style.slug,
    name: style.name,
    image: style.products[0]?.images[0] ?? null,
  }));
}
