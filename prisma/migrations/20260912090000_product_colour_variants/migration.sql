-- Promotes the payload-free `_ProductColors` join table into an explicit
-- `ProductVariant` row so a colour can own its own photographs, adds the
-- `ImageAsset` store behind admin uploads, and adds `User.isAdmin`.
--
-- Every existing product, colour pairing and photograph is carried across:
-- nothing is deleted. `_ProductColors` is dropped only after its contents have
-- been rewritten as `ProductVariant` rows.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ImageAsset" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "blurDataUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_colorId_idx" ON "ProductVariant"("colorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_colorId_key" ON "ProductVariant"("productId", "colorId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN "variantId" TEXT;
ALTER TABLE "ProductImage" ADD COLUMN "assetId" TEXT;

-- CreateIndex
CREATE INDEX "ProductImage_variantId_idx" ON "ProductImage"("variantId");

-- CreateIndex
CREATE INDEX "ProductImage_assetId_idx" ON "ProductImage"("assetId");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ImageAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: one variant per existing (product, colour) pair, ordered by the
-- colour's own position so the swatch order matches what the storefront
-- already showed.
INSERT INTO "ProductVariant" ("id", "productId", "colorId", "position", "createdAt", "updatedAt")
SELECT
    'pv' || replace(gen_random_uuid()::text, '-', ''),
    pc."B",
    pc."A",
    row_number() OVER (PARTITION BY pc."B" ORDER BY c."position", c."slug") - 1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "_ProductColors" pc
JOIN "Color" c ON c."id" = pc."A";

-- Backfill, part 1: attach each product's existing photographs to its first
-- variant. The catalogue ships one photograph per garment that was already
-- shown for every colour, so this is the only faithful reading of the old data.
UPDATE "ProductImage" pi
SET "variantId" = fv."id"
FROM (
    SELECT DISTINCT ON ("productId") "id", "productId"
    FROM "ProductVariant"
    ORDER BY "productId", "position"
) fv
WHERE fv."productId" = pi."productId" AND pi."variantId" IS NULL;

-- Backfill, part 2: give every other variant its own copy of those rows, so the
-- "each variant has at least one image" invariant holds for pre-existing rows
-- too. An admin can replace any of them with a real photograph of that colour.
INSERT INTO "ProductImage" ("id", "productId", "variantId", "url", "alt", "blurDataUrl", "width", "height", "position")
SELECT
    'pi' || replace(gen_random_uuid()::text, '-', ''),
    src."productId",
    v."id",
    src."url",
    src."alt",
    src."blurDataUrl",
    src."width",
    src."height",
    v."position" * 100 + src."position"
FROM "ProductVariant" v
JOIN "ProductVariant" first ON first."productId" = v."productId" AND first."position" = 0
JOIN "ProductImage" src ON src."variantId" = first."id"
WHERE v."position" > 0;

-- DropForeignKey
ALTER TABLE "_ProductColors" DROP CONSTRAINT "_ProductColors_A_fkey";
ALTER TABLE "_ProductColors" DROP CONSTRAINT "_ProductColors_B_fkey";

-- DropTable
DROP TABLE "_ProductColors";
