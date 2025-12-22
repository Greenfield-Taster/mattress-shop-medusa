import { model } from "@medusajs/framework/utils"

/**
 * PromoCode - модель промокоду для знижок
 *
 * Підтримує:
 * - Відсоткові знижки (percentage)
 * - Фіксовані знижки (fixed)
 * - Мінімальну суму замовлення
 * - Ліміт використань
 * - Період дії (starts_at, expires_at)
 */
export const PromoCode = model.define("promo_code", {
  id: model.id().primaryKey(),

  // ===== ОСНОВНІ ПОЛЯ =====

  /** Унікальний код промокоду (наприклад: SAVE10, VIP500) */
  code: model.text().unique(),

  /** Опис промокоду для адмін-панелі */
  description: model.text().nullable(),

  // ===== ЗНИЖКА =====

  /** Тип знижки: percentage (%) або fixed (фіксована сума) */
  discount_type: model.enum(["percentage", "fixed"]),

  /** Значення знижки (відсоток або сума в копійках/центах) */
  discount_value: model.number(),

  // ===== ОБМЕЖЕННЯ =====

  /** Мінімальна сума замовлення для застосування (в копійках/центах) */
  min_order_amount: model.number().default(0),

  /** Максимальна кількість використань (0 = необмежено) */
  max_uses: model.number().default(0),

  /** Поточна кількість використань */
  current_uses: model.number().default(0),

  // ===== ПЕРІОД ДІЇ =====

  /** Дата початку дії (null = одразу активний) */
  starts_at: model.dateTime().nullable(),

  /** Дата закінчення дії (null = безстроковий) */
  expires_at: model.dateTime().nullable(),

  // ===== СТАТУС =====

  /** Чи активний промокод */
  is_active: model.boolean().default(true),
})

export default PromoCode
