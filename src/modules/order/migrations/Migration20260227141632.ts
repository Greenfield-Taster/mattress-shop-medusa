import { Migration } from '@mikro-orm/migrations';

export class Migration20260227141632 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shop_order" add column if not exists "transaction_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "shop_order" drop column if exists "transaction_id";`);
  }

}
