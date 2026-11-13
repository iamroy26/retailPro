-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE IF NOT EXISTS "roles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "products" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "cost_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(12,2) NOT NULL,
    "stock_quantity" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reorder_threshold" DECIMAL(12,2) NOT NULL DEFAULT 5,
    "description" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT NOT NULL DEFAULT '',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT 'blue',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "customers" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'cash',
    "expense_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sales" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "sale_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "item_count" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gross_profit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_method" TEXT NOT NULL,
    "amount_received" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "change_due" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "customer_id" UUID,
    "customer_name" TEXT NOT NULL DEFAULT '',
    "cashier_name" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT NOT NULL DEFAULT '',
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sale_items" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "product_id" UUID,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "cost_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payments" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "payment_method" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "paid_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "supplier_id" UUID,
    "product_name" TEXT NOT NULL,
    "sku" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "quantity_change" DECIMAL(12,2) NOT NULL,
    "quantity_before" DECIMAL(12,2) NOT NULL,
    "quantity_after" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "reference" TEXT NOT NULL DEFAULT '',
    "recorded_by" TEXT NOT NULL DEFAULT '',
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "supplier_purchases" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "reference" TEXT NOT NULL DEFAULT '',
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "purchased_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "supplier_purchase_items" (
    "id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_cost" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "supplier_purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "store_name" TEXT NOT NULL DEFAULT 'RetailPro Store',
    "store_tagline" TEXT NOT NULL DEFAULT 'Provisions & General Goods',
    "store_address" TEXT NOT NULL DEFAULT '',
    "store_phone" TEXT NOT NULL DEFAULT '',
    "tin" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "tax_rate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "receipt_footer" TEXT NOT NULL DEFAULT 'Thank you for shopping with us.',
    "low_stock_threshold" DECIMAL(12,2) NOT NULL DEFAULT 5,
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- Additive compatibility for databases created by the original SQL backend.
CREATE UNIQUE INDEX IF NOT EXISTS "roles_code_key" ON "roles"("code");

INSERT INTO "roles" ("id", "code", "name")
VALUES
    (gen_random_uuid(), 'admin', 'Administrator'),
    (gen_random_uuid(), 'manager', 'Manager'),
    (gen_random_uuid(), 'cashier', 'Cashier')
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role_id" UUID;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" UUID;
ALTER TABLE "products" ALTER COLUMN "sku" DROP NOT NULL;
UPDATE "products" SET "sku" = NULL WHERE "sku" = '';
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "supplier_id" UUID;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
    ) THEN
        UPDATE "users" u
        SET "role_id" = COALESCE(
            (SELECT r."id" FROM "roles" r WHERE r."code" = lower(u."role")),
            (SELECT r."id" FROM "roles" r WHERE r."code" = 'admin')
        )
        WHERE u."role_id" IS NULL;
    ELSE
        UPDATE "users"
        SET "role_id" = (SELECT "id" FROM "roles" WHERE "code" = 'admin')
        WHERE "role_id" IS NULL;
    END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;

UPDATE "products" p
SET "category_id" = c."id"
FROM "categories" c
WHERE p."category_id" IS NULL
  AND p."owner_id" = c."owner_id"
  AND p."category" = c."name";

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'items'
    ) THEN
        INSERT INTO "sale_items" (
            "id", "sale_id", "product_id", "name", "sku", "unit",
            "quantity", "unit_price", "cost_price", "line_total"
        )
        SELECT
            md5(s."id"::text || ':' || item.ordinality::text)::uuid,
            s."id",
            CASE
                WHEN (item.value ->> 'product_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    THEN (item.value ->> 'product_id')::uuid
                ELSE NULL
            END,
            COALESCE(item.value ->> 'name', 'Unknown item'),
            COALESCE(item.value ->> 'sku', ''),
            COALESCE(item.value ->> 'unit', 'pcs'),
            COALESCE(NULLIF(item.value ->> 'quantity', '')::numeric, 0),
            COALESCE(NULLIF(item.value ->> 'unit_price', '')::numeric, 0),
            COALESCE(NULLIF(item.value ->> 'cost_price', '')::numeric, 0),
            COALESCE(NULLIF(item.value ->> 'line_total', '')::numeric, 0)
        FROM "sales" s
        CROSS JOIN LATERAL jsonb_array_elements(
            CASE WHEN jsonb_typeof(s."items") = 'array' THEN s."items" ELSE '[]'::jsonb END
        ) WITH ORDINALITY AS item(value, ordinality)
        ON CONFLICT ("id") DO NOTHING;
    END IF;
END $$;

INSERT INTO "payments" ("id", "owner_id", "sale_id", "payment_method", "amount", "reference", "status", "paid_at")
SELECT
    md5(s."id"::text || ':initial-payment')::uuid,
    s."owner_id",
    s."id",
    s."payment_method",
    s."total",
    s."receipt_number",
    'recorded',
    s."sale_date"
FROM "sales" s
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
ALTER TABLE "sales" DROP COLUMN IF EXISTS "items";
ALTER TABLE "products" ALTER COLUMN "sku" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_owner_id_name_idx" ON "products"("owner_id", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_owner_id_category_idx" ON "products"("owner_id", "category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_owner_id_stock_quantity_idx" ON "products"("owner_id", "stock_quantity");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "products_owner_id_sku_key" ON "products"("owner_id", "sku");

DROP INDEX IF EXISTS "products_owner_sku_unique";
DROP INDEX IF EXISTS "products_owner_name_idx";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "categories_owner_id_name_key" ON "categories"("owner_id", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customers_owner_id_name_idx" ON "customers"("owner_id", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "suppliers_owner_id_name_idx" ON "suppliers"("owner_id", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expenses_owner_id_expense_date_idx" ON "expenses"("owner_id", "expense_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_owner_id_sale_date_idx" ON "sales"("owner_id", "sale_date" DESC);

DROP INDEX IF EXISTS "sales_owner_date_idx";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sales_owner_id_receipt_number_key" ON "sales"("owner_id", "receipt_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sale_items_sale_id_idx" ON "sale_items"("sale_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sale_items_product_id_idx" ON "sale_items"("product_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_owner_id_paid_at_idx" ON "payments"("owner_id", "paid_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_sale_id_idx" ON "payments"("sale_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_movements_owner_id_created_date_idx" ON "stock_movements"("owner_id", "created_date" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_movements_product_id_created_date_idx" ON "stock_movements"("product_id", "created_date" DESC);

DROP INDEX IF EXISTS "stock_movements_owner_date_idx";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "supplier_purchases_owner_id_purchased_at_idx" ON "supplier_purchases"("owner_id", "purchased_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "supplier_purchase_items_purchase_id_idx" ON "supplier_purchase_items"("purchase_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "app_settings_owner_id_key" ON "app_settings"("owner_id");

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_id_fkey' AND conrelid = '"users"'::regclass) THEN ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_owner_id_fkey' AND conrelid = '"products"'::regclass) THEN ALTER TABLE "products" ADD CONSTRAINT "products_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey' AND conrelid = '"products"'::regclass) THEN ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_owner_id_fkey' AND conrelid = '"categories"'::regclass) THEN ALTER TABLE "categories" ADD CONSTRAINT "categories_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_owner_id_fkey' AND conrelid = '"customers"'::regclass) THEN ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_owner_id_fkey' AND conrelid = '"suppliers"'::regclass) THEN ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_owner_id_fkey' AND conrelid = '"expenses"'::regclass) THEN ALTER TABLE "expenses" ADD CONSTRAINT "expenses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_owner_id_fkey' AND conrelid = '"sales"'::regclass) THEN ALTER TABLE "sales" ADD CONSTRAINT "sales_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_customer_id_fkey' AND conrelid = '"sales"'::regclass) THEN ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_sale_id_fkey' AND conrelid = '"sale_items"'::regclass) THEN ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_product_id_fkey' AND conrelid = '"sale_items"'::regclass) THEN ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_owner_id_fkey' AND conrelid = '"payments"'::regclass) THEN ALTER TABLE "payments" ADD CONSTRAINT "payments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_sale_id_fkey' AND conrelid = '"payments"'::regclass) THEN ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_owner_id_fkey' AND conrelid = '"stock_movements"'::regclass) THEN ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_product_id_fkey' AND conrelid = '"stock_movements"'::regclass) THEN ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_supplier_id_fkey' AND conrelid = '"stock_movements"'::regclass) THEN ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_purchases_owner_id_fkey' AND conrelid = '"supplier_purchases"'::regclass) THEN ALTER TABLE "supplier_purchases" ADD CONSTRAINT "supplier_purchases_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_purchases_supplier_id_fkey' AND conrelid = '"supplier_purchases"'::regclass) THEN ALTER TABLE "supplier_purchases" ADD CONSTRAINT "supplier_purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_purchase_items_purchase_id_fkey' AND conrelid = '"supplier_purchase_items"'::regclass) THEN ALTER TABLE "supplier_purchase_items" ADD CONSTRAINT "supplier_purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "supplier_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_purchase_items_product_id_fkey' AND conrelid = '"supplier_purchase_items"'::regclass) THEN ALTER TABLE "supplier_purchase_items" ADD CONSTRAINT "supplier_purchase_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_owner_id_fkey' AND conrelid = '"app_settings"'::regclass) THEN ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;
