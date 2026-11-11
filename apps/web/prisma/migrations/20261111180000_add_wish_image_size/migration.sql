-- Pixel size of the wish photo, so clients reserve its space before it loads (no layout shift).
-- Nullable: existing rows are filled by scripts/backfill-image-sizes.mjs.
ALTER TABLE "Wish" ADD COLUMN "imageWidth" INTEGER;
ALTER TABLE "Wish" ADD COLUMN "imageHeight" INTEGER;
