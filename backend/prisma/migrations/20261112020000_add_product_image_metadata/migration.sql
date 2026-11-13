ALTER TABLE "products"
  ADD COLUMN "brand" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "image_metadata" JSONB;
