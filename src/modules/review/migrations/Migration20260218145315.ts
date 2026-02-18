import { Migration } from '@mikro-orm/migrations';

export class Migration20260218145315 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shop_review" drop constraint if exists "shop_review_email_product_id_unique";`);
    this.addSql(`create table if not exists "shop_review" ("id" text not null, "product_id" text not null, "customer_id" text null, "name" text not null, "email" text not null, "rating" integer not null, "comment" text not null, "is_verified_purchase" boolean not null default false, "status" text not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shop_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_review_deleted_at" ON "shop_review" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_review_product_id" ON "shop_review" (product_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shop_review_email_product_id_unique" ON "shop_review" (email, product_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_review_status" ON "shop_review" (status) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "shop_review" cascade;`);
  }

}
