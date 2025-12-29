import { Migration } from '@mikro-orm/migrations';

export class Migration20251229175143 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shop_order" drop constraint if exists "shop_order_order_number_unique";`);
    this.addSql(`create table if not exists "shop_order" ("id" text not null, "order_number" text not null, "customer_id" text null, "full_name" text not null, "phone" text not null, "email" text not null, "comment" text null, "delivery_method" text not null, "delivery_city" text null, "delivery_city_ref" text null, "delivery_address" text null, "delivery_warehouse" text null, "payment_method" text not null, "payment_status" text not null default 'pending', "company_name" text null, "edrpou" text null, "company_address" text null, "subtotal" numeric not null, "discount_amount" numeric not null default 0, "total" numeric not null, "currency" text not null default 'UAH', "promo_code" text null, "promo_discount_type" text null, "promo_discount_value" numeric null, "status" text not null default 'pending', "admin_notes" text null, "raw_subtotal" jsonb not null, "raw_discount_amount" jsonb not null, "raw_total" jsonb not null, "raw_promo_discount_value" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shop_order_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_order_deleted_at" ON "shop_order" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shop_order_order_number_unique" ON "shop_order" (order_number) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_order_customer_id" ON "shop_order" (customer_id) WHERE customer_id IS NOT NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_order_phone" ON "shop_order" (phone) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_order_status" ON "shop_order" (status) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "shop_order_item" ("id" text not null, "order_id" text not null, "product_id" text null, "variant_id" text null, "title" text not null, "image" text null, "size" text null, "firmness" text null, "unit_price" numeric not null, "quantity" integer not null default 1, "total" numeric not null, "raw_unit_price" jsonb not null, "raw_total" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shop_order_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_order_item_deleted_at" ON "shop_order_item" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_order_item_order_id" ON "shop_order_item" (order_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_order_item_product_id" ON "shop_order_item" (product_id) WHERE product_id IS NOT NULL AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "shop_order" cascade;`);

    this.addSql(`drop table if exists "shop_order_item" cascade;`);
  }

}
