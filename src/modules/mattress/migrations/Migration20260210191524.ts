import { Migration } from '@mikro-orm/migrations';

export class Migration20260210191524 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "mattress_attributes" add column if not exists "product_type" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "mattress_attributes" drop column if exists "product_type";`);
  }

}
