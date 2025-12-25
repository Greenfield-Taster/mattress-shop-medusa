import { Migration } from '@mikro-orm/migrations';

export class Migration20251225140941 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shop_customer" drop constraint if exists "shop_customer_google_id_unique";`);
    this.addSql(`alter table if exists "shop_customer" drop constraint if exists "shop_customer_email_unique";`);
    this.addSql(`alter table if exists "shop_customer" drop constraint if exists "shop_customer_phone_unique";`);
    this.addSql(`create table if not exists "shop_customer" ("id" text not null, "phone" text null, "email" text null, "first_name" text null, "last_name" text null, "avatar" text null, "verification_code" text null, "code_expires_at" timestamptz null, "google_id" text null, "last_login_at" timestamptz null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shop_customer_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_customer_deleted_at" ON "shop_customer" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shop_customer_phone_unique" ON "shop_customer" (phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shop_customer_email_unique" ON "shop_customer" (email) WHERE email IS NOT NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shop_customer_google_id_unique" ON "shop_customer" (google_id) WHERE google_id IS NOT NULL AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "shop_customer" cascade;`);
  }

}
