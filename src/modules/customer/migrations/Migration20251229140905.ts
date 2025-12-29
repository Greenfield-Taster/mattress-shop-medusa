import { Migration } from '@mikro-orm/migrations';

export class Migration20251229140905 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shop_customer" add column if not exists "city" text null, add column if not exists "address" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "shop_customer" drop column if exists "city", drop column if exists "address";`);
  }

}
