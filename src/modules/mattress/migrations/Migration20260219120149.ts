import { Migration } from '@mikro-orm/migrations';

export class Migration20260219120149 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "mattress_attributes" add column if not exists "certificates" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "mattress_attributes" drop column if exists "certificates";`);
  }

}
