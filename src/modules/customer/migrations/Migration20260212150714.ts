import { Migration } from '@mikro-orm/migrations';

export class Migration20260212150714 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shop_customer" drop column if exists "avatar", drop column if exists "city", drop column if exists "address";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "shop_customer" add column if not exists "avatar" text null, add column if not exists "city" text null, add column if not exists "address" text null;`);
  }

}
