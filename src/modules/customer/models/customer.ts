import { model } from "@medusajs/framework/utils";

/**
 * Customer - модель користувача магазину
 *
 * Підтримує автентифікацію через:
 * - SMS (phone + verification_code)
 * - Google OAuth (email + google_id)
 */
export const Customer = model
  .define("shop_customer", {
    id: model.id().primaryKey(),

    // ===== КОНТАКТНІ ДАНІ =====

    /** Номер телефону (для SMS автентифікації) */
    phone: model.text().nullable(),

    /** Email адреса (для Google OAuth) */
    email: model.text().nullable(),

    // ===== ПЕРСОНАЛЬНІ ДАНІ =====

    /** Ім'я користувача */
    first_name: model.text().nullable(),

    /** Прізвище користувача */
    last_name: model.text().nullable(),

    // ===== SMS ВЕРИФІКАЦІЯ =====

    /**
     * Код верифікації для SMS (6 цифр)
     * Очищується після успішної верифікації
     */
    verification_code: model.text().nullable(),

    /**
     * Час закінчення дії коду верифікації
     * TTL = 5 хвилин
     */
    code_expires_at: model.dateTime().nullable(),

    // ===== GOOGLE OAUTH =====

    /** Google user ID для швидкої автентифікації */
    google_id: model.text().nullable(),

    // ===== МЕТАДАНІ =====

    /** Дата останнього входу */
    last_login_at: model.dateTime().nullable(),

    /** Чи активний акаунт */
    is_active: model.boolean().default(true),
  })
  .indexes([
    // Унікальні індекси для пошуку
    { on: ["phone"], unique: true, where: "phone IS NOT NULL" },
    { on: ["email"], unique: true, where: "email IS NOT NULL" },
    { on: ["google_id"], unique: true, where: "google_id IS NOT NULL" },
  ]);

export default Customer;
