import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Скрипт для повного скидання модуля promo_code
 * Використання: npx medusa exec ./src/scripts/reset-promo-code.ts
 */
export default async function resetPromoCode({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  logger.info("Resetting promo_code module...")

  try {
    // 1. Дропаємо таблицю
    await pgConnection.raw(`DROP TABLE IF EXISTS "promo_code" CASCADE;`)
    logger.info("Table dropped!")

    // 2. Видаляємо запис міграції
    await pgConnection.raw(`
      DELETE FROM "mikro_orm_migrations"
      WHERE name LIKE '%promoCode%' OR name LIKE '%promo_code%' OR name LIKE '%PromoCode%';
    `)
    logger.info("Migration record deleted!")

    logger.info("Done! Now run: npx medusa db:migrate")
  } catch (error: any) {
    logger.error("Error:", error.message)
  }
}
