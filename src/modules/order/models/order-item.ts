import { model } from "@medusajs/framework/utils";

/**
 * OrderItem - товар у замовленні
 *
 * Зберігає snapshot товару на момент замовлення,
 * щоб зміни в каталозі не впливали на історію замовлень
 */
export const OrderItem = model
  .define("shop_order_item", {
    id: model.id().primaryKey(),

    /** ID замовлення (зв'язок з shop_order) */
    order_id: model.text(),

    // ===== ТОВАР =====

    /** ID продукту в каталозі (для посилання) */
    product_id: model.text().nullable(),

    /** ID варіанту продукту */
    variant_id: model.text().nullable(),

    /** Назва товару (snapshot) */
    title: model.text(),

    /** URL зображення товару (snapshot) */
    image: model.text().nullable(),

    // ===== ВАРІАНТ =====

    /** Розмір матраца (наприклад, "160×200") */
    size: model.text().nullable(),

    /** Жорсткість (наприклад, "H3") */
    firmness: model.text().nullable(),

    // ===== ЦІНА ТА КІЛЬКІСТЬ =====

    /** Ціна за одиницю на момент замовлення */
    unit_price: model.bigNumber(),

    /** Кількість */
    quantity: model.number().default(1),

    /** Загальна сума (unit_price * quantity) */
    total: model.bigNumber(),
  })
  .indexes([
    // Швидкий пошук товарів замовлення
    { on: ["order_id"] },
    // Статистика по продуктах
    { on: ["product_id"], where: "product_id IS NOT NULL" },
  ]);

export default OrderItem;
