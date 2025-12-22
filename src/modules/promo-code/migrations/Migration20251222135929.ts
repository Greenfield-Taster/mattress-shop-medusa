import { Migration } from '@mikro-orm/migrations';

export class Migration20251222135929 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "promo_code" drop constraint if exists "promo_code_code_unique";`);
    this.addSql(`create table if not exists "promo_code" ("id" text not null, "code" text not null, "description" text null, "discount_type" text check ("discount_type" in ('percentage', 'fixed')) not null, "discount_value" integer not null, "min_order_amount" integer not null default 0, "max_uses" integer not null default 0, "current_uses" integer not null default 0, "starts_at" timestamptz null, "expires_at" timestamptz null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promo_code_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_promo_code_code_unique" ON "promo_code" (code) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promo_code_deleted_at" ON "promo_code" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "promo_code" cascade;`);
  }

}
