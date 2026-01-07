import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHOP_ORDER_MODULE } from "../../../../modules/order"
import type OrderModuleService from "../../../../modules/order/service"
import { extractBearerToken, verifyToken } from "../../../../utils/jwt"

// Вимикаємо вбудовану авторизацію MedusaJS - використовуємо власну JWT авторизацію
export const AUTHENTICATE = false

/**
 * GET /store/orders/:id
 *
 * Отримує деталі конкретного замовлення
 *
 * Доступ:
 * - Авторизований користувач бачить свої замовлення
 * - По номеру замовлення (order_number) - публічний доступ для трекінгу
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID замовлення обов'язковий",
      })
    }

    const orderService = req.scope.resolve<OrderModuleService>(SHOP_ORDER_MODULE)

    // Спробуємо знайти замовлення
    let order

    // Визначаємо, чи це order_number чи внутрішній ID
    // Внутрішній ID MedusaJS зазвичай починається з "01" (ULID формат)
    // Номер замовлення - це 8-значне число або старий формат ORD-YYYY-XXXXX
    const isOrderNumber = id.startsWith("ORD-") || /^\d{8}$/.test(id)

    if (isOrderNumber) {
      order = await orderService.findByOrderNumber(id)
    } else {
      // Інакше шукаємо по ID
      order = await orderService.getOrderWithItems(id)
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Замовлення не знайдено",
      })
    }

    // Перевірка доступу для авторизованих користувачів
    const token = extractBearerToken(req.headers.authorization)
    let isOwner = false

    if (token) {
      const payload = verifyToken(token)
      if (payload?.userId && order.customer_id === payload.userId) {
        isOwner = true
      }
    }

    // Формуємо відповідь
    // Для власника - повна інформація
    // Для інших - обмежена (тільки статус і базова інфа)
    const response = isOwner
      ? {
          // Повна інформація для власника
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,

          // Контактні дані
          full_name: order.full_name,
          phone: order.phone,
          email: order.email,
          comment: order.comment,

          // Доставка
          delivery_method: order.delivery_method,
          delivery_city: order.delivery_city,
          delivery_address: order.delivery_address,
          delivery_warehouse: order.delivery_warehouse,

          // Оплата
          payment_method: order.payment_method,
          company_name: order.company_name,
          edrpou: order.edrpou,
          company_address: order.company_address,

          // Суми
          subtotal: Number(order.subtotal) / 100,
          discount: Number(order.discount_amount) / 100,
          total: Number(order.total) / 100,
          currency: order.currency,

          // Промокод
          promo_code: order.promo_code,
          promo_discount_type: order.promo_discount_type,
          promo_discount_value: order.promo_discount_value,

          // Товари
          items: order.items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            title: item.title,
            image: item.image,
            size: item.size,
            firmness: item.firmness,
            price: Number(item.unit_price) / 100,
            quantity: item.quantity,
            total: Number(item.total) / 100,
          })),

          // Дати
          created_at: order.created_at,
          updated_at: order.updated_at,
        }
      : {
          // Повна інформація для трекінгу (публічний доступ по номеру замовлення)
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,

          // Контактні дані (для відображення отримувача)
          contact_data: {
            fullName: order.full_name,
          },

          // Доставка
          delivery_method: order.delivery_method,
          delivery_city: order.delivery_city,
          delivery_address: order.delivery_address,
          delivery_warehouse: order.delivery_warehouse,

          // Суми
          subtotal: Number(order.subtotal) / 100,
          discount: Number(order.discount_amount) / 100,
          total: Number(order.total) / 100,
          currency: order.currency,

          // Товари
          items: order.items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            title: item.title,
            image: item.image,
            size: item.size,
            firmness: item.firmness,
            price: Number(item.unit_price) / 100,
            quantity: item.quantity,
            total: Number(item.total) / 100,
          })),

          // Дати
          created_at: order.created_at,
          updated_at: order.updated_at,
        }

    return res.status(200).json({
      success: true,
      order: response,
      is_owner: isOwner,
    })
  } catch (error: any) {
    console.error("[orders/:id] Error fetching order:", error)
    return res.status(500).json({
      success: false,
      error: "Помилка отримання замовлення",
    })
  }
}
