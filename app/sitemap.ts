import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { COLLECTIONS } from "@/lib/constants";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// A sitemap is a Route Handler, and Next.js caches those by default — which
// means it is prerendered during `next build` and its queries run at build
// time. Since the build happens on a CI runner, that made every deployment
// depend on the database being reachable from GitHub Actions, and a build
// would fail outright if it was not:
//
//   Error occurred prerendering page "/sitemap.xml"
//   Invalid `prisma.product.findMany()` invocation: getaddrinfo EAI_AGAIN
//
// Rendering per request instead keeps the build free of database access. Note
// that `revalidate` would not help here: ISR still generates the first copy at
// build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...COLLECTIONS.map((collection) => ({
      url: `${BASE}/shop/${collection.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...categories.map((category) => ({
      url: `${BASE}/shop/${category.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${BASE}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
