import { model } from "@medusajs/framework/utils";

/**
 * Order - модель замовлення магазину
 *
 * Підтримує:
 * - Замовлення від авторизованих користувачів (customer_id)
 * - Замовлення від гостей (customer_id = null)
 * - Різні способи доставки та оплати
 */
export const Order = model
  .define("shop_order", {
    id: model.id().primaryKey(),

    /**
     * Номер замовлення для відображення клієнту
     * Формат: ORD-YYYY-XXXXX (наприклад, ORD-2024-00001)
     */
    order_number: model.text(),

    // ===== ЗВ'ЯЗОК З КОРИСТУВАЧЕМ =====

    /**
     * ID користувача (nullable для гостьових замовлень)
     * Посилання на shop_customer.id
     */
    customer_id: model.text().nullable(),

    // ===== КОНТАКТНІ ДАНІ =====

    /** ПІБ замовника */
    full_name: model.text(),

    /** Телефон замовника */
    phone: model.text(),

    /** Email замовника */
    email: model.text(),

    /** Коментар до замовлення */
    comment: model.text().nullable(),

    // ===== ДОСТАВКА =====

    /**
     * Спосіб доставки:
     * - nova-poshta
     * - delivery
     * - cat
     * - courier
     * - pickup
     */
    delivery_method: model.text(),

    /** Місто доставки */
    delivery_city: model.text().nullable(),

    /** Ref ID міста від API перевізника */
    delivery_city_ref: model.text().nullable(),

    /** Адреса (для кур'єрської доставки) */
    delivery_address: model.text().nullable(),

    /** Відділення/поштомат */
    delivery_warehouse: model.text().nullable(),

    /** Вартість доставки (в копійках) */
    delivery_price: model.bigNumber().default(0),

    /**
     * Тип ціни доставки:
     * - free (безкоштовно)
     * - fixed (фіксована ціна, напр. 500 грн)
     * - carrier (за тарифами перевізника — точна сума невідома)
     */
    delivery_price_type: model.text().default("free"),

    // ===== ОПЛАТА =====

    /**
     * Спосіб оплати:
     * - cash-on-delivery (накладений платіж)
     * - card-online (карткою онлайн)
     * - google-apple-pay
     * - invoice (рахунок для юр. осіб)
     */
    payment_method: model.text(),

    /**
     * Статус оплати:
     * - pending (очікує)
     * - paid (оплачено)
     * - failed (помилка)
     * - refunded (повернено)
     */
    payment_status: model.text().default("pending"),

    /** ID транзакції WayForPay (orderReference) */
    transaction_id: model.text().nullable(),

    // ===== ДАНІ ДЛЯ ЮРИДИЧНИХ ОСІБ =====

    /** Назва компанії (для invoice) */
    company_name: model.text().nullable(),

    /** ЄДРПОУ (для invoice) */
    edrpou: model.text().nullable(),

    /** Адреса компанії (для invoice) */
    company_address: model.text().nullable(),

    // ===== СУМИ =====

    /** Сума товарів без знижки */
    subtotal: model.bigNumber(),

    /** Сума знижки */
    discount_amount: model.bigNumber().default(0),

    /** Підсумкова сума до сплати */
    total: model.bigNumber(),

    /** Валюта (UAH) */
    currency: model.text().default("UAH"),

    // ===== ПРОМОКОД =====

    /** Застосований промокод */
    promo_code: model.text().nullable(),

    /** Тип знижки промокоду */
    promo_discount_type: model.text().nullable(),

    /** Значення знижки промокоду */
    promo_discount_value: model.bigNumber().nullable(),

    // ===== СТАТУС ЗАМОВЛЕННЯ =====

    /**
     * Статус замовлення:
     * - pending (нове)
     * - confirmed (підтверджено)
     * - processing (обробляється)
     * - shipping (в дорозі)
     * - delivered (доставлено)
     * - cancelled (скасовано)
     */
    status: model.text().default("pending"),

    /** Примітки менеджера */
    admin_notes: model.text().nullable(),
  })
  .indexes([
    // Швидкий пошук по номеру замовлення
    { on: ["order_number"], unique: true },
    // Пошук замовлень користувача
    { on: ["customer_id"], where: "customer_id IS NOT NULL" },
    // Пошук по телефону (для гостьових замовлень)
    { on: ["phone"] },
    // Пошук по статусу
    { on: ["status"] },
  ]);

export default Order;
