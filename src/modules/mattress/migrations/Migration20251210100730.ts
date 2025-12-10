import { Migration } from '@mikro-orm/migrations';

export class Migration20251210100730 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "mattress_attributes" ("id" text not null, "height" integer not null, "hardness" text check ("hardness" in ('H1', 'H2', 'H3', 'H4')) not null, "block_type" text check ("block_type" in ('independent_spring', 'bonnel_spring', 'springless')) not null, "cover_type" text check ("cover_type" in ('removable', 'non_removable')) not null, "max_weight" integer not null, "fillers" jsonb not null, "description_main" text null, "description_care" text null, "specs" jsonb null, "is_new" boolean not null default false, "discount_percent" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mattress_attributes_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mattress_attributes_deleted_at" ON "mattress_attributes" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mattress_attributes" cascade;`);
  }

}
