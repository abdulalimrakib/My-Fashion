import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personal and transactional routes carry nothing worth indexing.
      disallow: ["/account", "/cart", "/checkout", "/wishlist", "/login", "/register", "/search"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
