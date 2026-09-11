/**
 * Seeds the catalogue from `seed-data.ts` and the images copied out of
 * `shop.co/`. Safe to re-run: everything is upserted by its natural key and
 * per-product join rows are `set` rather than appended.
 *
 * Run with `npm run db:seed`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import {
  CATEGORIES,
  COLORS,
  DRESS_STYLES,
  PRODUCTS,
  PROMO_CODES,
  SIZES,
  TESTIMONIALS,
} from "./seed-data";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const blurPlaceholders: Record<string, string> = JSON.parse(
  readFileSync(join(import.meta.dirname, "blur-placeholders.json"), "utf8"),
);

/** Product cut-outs from shop.co are all 300x300 with transparency. */
const PRODUCT_IMAGE_SIZE = 300;

const DAY_MS = 24 * 60 * 60 * 1000;

async function main() {
  console.log("Seeding reference data…");

  await Promise.all([
    ...CATEGORIES.map((c) =>
      prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c }),
    ),
    ...DRESS_STYLES.map((s) =>
      prisma.dressStyle.upsert({ where: { slug: s.slug }, update: s, create: s }),
    ),
    ...COLORS.map((c) =>
      prisma.color.upsert({ where: { slug: c.slug }, update: c, create: c }),
    ),
    ...SIZES.map((s) =>
      prisma.size.upsert({ where: { slug: s.slug }, update: s, create: s }),
    ),
  ]);

  const [categories, styles, colors, sizes] = await Promise.all([
    prisma.category.findMany(),
    prisma.dressStyle.findMany(),
    prisma.color.findMany(),
    prisma.size.findMany(),
  ]);

  const bySlug = <T extends { slug: string; id: string }>(rows: T[]) =>
    new Map(rows.map((r) => [r.slug, r.id]));
  const categoryId = bySlug(categories);
  const styleId = bySlug(styles);
  const colorId = bySlug(colors);
  const sizeId = bySlug(sizes);

  console.log(`Seeding ${PRODUCTS.length} products…`);

  for (const p of PRODUCTS) {
    const catId = categoryId.get(p.category);
    if (!catId) throw new Error(`Unknown category "${p.category}" on ${p.slug}`);

    const connectStyles = p.styles.map((s) => {
      const id = styleId.get(s);
      if (!id) throw new Error(`Unknown dress style "${s}" on ${p.slug}`);
      return { id };
    });
    const connectColors = p.colors.map((c) => {
      const id = colorId.get(c);
      if (!id) throw new Error(`Unknown colour "${c}" on ${p.slug}`);
      return { id };
    });
    const connectSizes = p.sizes.map((s) => {
      const id = sizeId.get(s);
      if (!id) throw new Error(`Unknown size "${s}" on ${p.slug}`);
      return { id };
    });

    // Ratings are derived from the seeded reviews so the star display and the
    // review list can never disagree.
    const reviewCount = p.reviews.length;
    const rating =
      Math.round((p.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10;

    const scalars = {
      name: p.name,
      description: p.description,
      details: p.details,
      priceCents: p.price * 100,
      compareAtPriceCents: p.compareAt ? p.compareAt * 100 : null,
      rating,
      reviewCount,
      isNewArrival: p.isNewArrival ?? false,
      isTopSelling: p.isTopSelling ?? false,
      categoryId: catId,
    };

    // `set` replaces the join rows on update; `connect` is the only form the
    // create branch accepts.
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        ...scalars,
        styles: { set: connectStyles },
        colors: { set: connectColors },
        sizes: { set: connectSizes },
      },
      create: {
        slug: p.slug,
        ...scalars,
        styles: { connect: connectStyles },
        colors: { connect: connectColors },
        sizes: { connect: connectSizes },
      },
    });

    const url = `/images/products/${p.image}`;
    const blurDataUrl = blurPlaceholders[url];
    if (!blurDataUrl) throw new Error(`No blur placeholder generated for ${url}`);

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url,
        alt: `${p.name} — product photograph on a plain background`,
        blurDataUrl,
        width: PRODUCT_IMAGE_SIZE,
        height: PRODUCT_IMAGE_SIZE,
        position: 0,
      },
    });

    await prisma.review.deleteMany({ where: { productId: product.id, userId: null } });
    await prisma.review.createMany({
      data: p.reviews.map((r) => ({
        productId: product.id,
        authorName: r.author,
        rating: r.rating,
        body: r.body,
        createdAt: new Date(Date.now() - r.daysAgo * DAY_MS),
      })),
    });
  }

  console.log("Seeding testimonials and promo codes…");

  await prisma.testimonial.deleteMany({});
  await prisma.testimonial.createMany({
    data: TESTIMONIALS.map((t, position) => ({ ...t, position })),
  });

  await Promise.all(
    PROMO_CODES.map((c) =>
      prisma.promoCode.upsert({
        where: { code: c.code },
        update: { percentOff: c.percentOff, isActive: true },
        create: { ...c },
      }),
    ),
  );

  const [products, reviews] = await Promise.all([
    prisma.product.count(),
    prisma.review.count(),
  ]);
  console.log(`Done. ${products} products, ${reviews} reviews.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
