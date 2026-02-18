import { model } from "@medusajs/framework/utils"

/**
 * Review - модель відгуку для товару
 *
 * Підтримує:
 * - Відгуки від авторизованих та гостьових користувачів
 * - Модерацію (pending/approved/rejected)
 * - Перевірку покупки (is_verified_purchase)
 * - Один відгук на email+product (унікальний індекс)
 */
export const Review = model
  .define("shop_review", {
    id: model.id().primaryKey(),

    /** ID продукту (MedusaJS Product ID) */
    product_id: model.text(),

    /** ID користувача (nullable для гостьових відгуків) */
    customer_id: model.text().nullable(),

    /** Ім'я автора */
    name: model.text(),

    /** Email автора */
    email: model.text(),

    /** Оцінка від 1 до 5 */
    rating: model.number(),

    /** Текст відгуку */
    comment: model.text(),

    /** Чи підтверджена покупка */
    is_verified_purchase: model.boolean().default(false),

    /**
     * Статус модерації:
     * - pending (на модерації)
     * - approved (схвалено)
     * - rejected (відхилено)
     */
    status: model.text().default("pending"),
  })
  .indexes([
    { on: ["product_id"] },
    { on: ["email", "product_id"], unique: true },
    { on: ["status"] },
  ])

export default Review
