import { Migration } from '@mikro-orm/migrations';

export class Migration20260210132543 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "mattress_attributes" drop constraint if exists "mattress_attributes_hardness_check";`);

    this.addSql(`alter table if exists "mattress_attributes" add constraint "mattress_attributes_hardness_check" check("hardness" in ('H1', 'H2', 'H3', 'H4', 'H5'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "mattress_attributes" drop constraint if exists "mattress_attributes_hardness_check";`);

    this.addSql(`alter table if exists "mattress_attributes" add constraint "mattress_attributes_hardness_check" check("hardness" in ('H1', 'H2', 'H3', 'H4'));`);
  }

}
