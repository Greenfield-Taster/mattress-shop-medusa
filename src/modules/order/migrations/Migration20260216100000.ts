import { Migration } from '@mikro-orm/migrations';

export class Migration20260216100000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shop_order" add column if not exists "delivery_price" numeric not null default 0;`);
    this.addSql(`alter table if exists "shop_order" add column if not exists "raw_delivery_price" jsonb not null default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "shop_order" add column if not exists "delivery_price_type" text not null default 'free';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "shop_order" drop column if exists "delivery_price";`);
    this.addSql(`alter table if exists "shop_order" drop column if exists "raw_delivery_price";`);
    this.addSql(`alter table if exists "shop_order" drop column if exists "delivery_price_type";`);
  }

}
