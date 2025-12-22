import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Перевірка стану таблиці promo_code
 */
export default async function checkPromoTable({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  try {
    // Перевіряємо чи є таблиця
    const tableCheck = await pgConnection.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'promo_code'
      );
    `)
    logger.info(`Table exists: ${tableCheck.rows[0].exists}`)

    if (tableCheck.rows[0].exists) {
      // Отримуємо колонки
      const columns = await pgConnection.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'promo_code'
        ORDER BY ordinal_position;
      `)
      logger.info("Columns:")
      columns.rows.forEach((col: any) => {
        logger.info(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    }

    // Перевіряємо міграції
    const migrations = await pgConnection.raw(`
      SELECT * FROM "mikro_orm_migrations"
      WHERE name LIKE '%promo%' OR name LIKE '%Promo%';
    `)
    logger.info(`Migration records: ${migrations.rows.length}`)
    migrations.rows.forEach((m: any) => {
      logger.info(`  - ${m.name} (executed: ${m.executed_at})`)
    })

  } catch (error: any) {
    logger.error("Error:", error.message)
  }
}
