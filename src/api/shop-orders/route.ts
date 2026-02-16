import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHOP_ORDER_MODULE } from "../../modules/order"
import type OrderModuleService from "../../modules/order/service"
import { CUSTOMER_MODULE } from "../../modules/customer"
import type CustomerModuleService from "../../modules/customer/service"
import { extractBearerToken, verifyToken } from "../../utils/jwt"

/**
 * Нормалізує телефон до останніх 9 цифр для порівняння
 * Це дозволяє порівнювати телефони в різних форматах:
 * +380333333334, 0333333334, 033 333 33 34 → 333333334
 */
function normalizePhoneForComparison(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits.slice(-9)
}

/**
 * GET /shop-orders
 *
 * Отримує список замовлень авторизованого користувача.
 * Шукає замовлення по:
 * 1. customer_id - прямий зв'язок з користувачем
 * 2. телефону - для гостьових замовлень, зроблених до реєстрації
 *
 * Потрібна авторизація через JWT!
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const token = extractBearerToken(req.headers.authorization)

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Необхідна авторизація",
      })
    }

    const payload = verifyToken(token)

    if (!payload?.userId) {
      return res.status(401).json({
        success: false,
        error: "Недійсний токен авторизації",
      })
    }

    const orderService = req.scope.resolve<OrderModuleService>(SHOP_ORDER_MODULE)
    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)

    // Отримуємо дані користувача для пошуку по телефону
    let customerPhone: string | null = null
    try {
      const customer = await customerService.retrieveCustomer(payload.userId)
      customerPhone = customer?.phone || null
    } catch {
      // Користувач не знайдений - продовжуємо без пошуку по телефону
    }

    // 1. Отримуємо замовлення по customer_id
    const ordersByCustomerId = await orderService.getCustomerOrders(payload.userId)

    // 2. Отримуємо замовлення по телефону (для гостьових замовлень)
    let ordersByPhone: Awaited<ReturnType<typeof orderService.getOrdersByPhone>> = []

    if (customerPhone) {
      const customerPhoneNormalized = normalizePhoneForComparison(customerPhone)
      const allOrders = await orderService.listOrders({}, { order: { created_at: "DESC" } })

      for (const order of allOrders) {
        if (order.phone) {
          const orderPhoneNormalized = normalizePhoneForComparison(order.phone)

          if (orderPhoneNormalized === customerPhoneNormalized) {
            const orderWithItems = await orderService.getOrderWithItems(order.id)
            if (orderWithItems) {
              ordersByPhone.push(orderWithItems)
            }
          }
        }
      }
    }

    // Об'єднуємо результати, уникаючи дублікатів
    const orderIds = new Set<string>()
    const orders: typeof ordersByCustomerId = []

    for (const order of [...ordersByCustomerId, ...ordersByPhone]) {
      if (!orderIds.has(order.id)) {
        orderIds.add(order.id)
        orders.push(order)
      }
    }

    // Сортуємо по даті (найновіші спочатку)
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Форматуємо відповідь
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      delivery_method: order.delivery_method,
      delivery_city: order.delivery_city,
      delivery_warehouse: order.delivery_warehouse,
      delivery_price: Number(order.delivery_price || 0) / 100,
      delivery_price_type: order.delivery_price_type || "free",
      subtotal: Number(order.subtotal) / 100,
      discount: Number(order.discount_amount) / 100,
      total: Number(order.total) / 100,
      promo_code: order.promo_code,
      created_at: order.created_at,
      items: order.items.map((item) => ({
        id: item.id,
        title: item.title,
        image: item.image,
        size: item.size,
        firmness: item.firmness,
        unit_price: Number(item.unit_price) / 100,
        quantity: item.quantity,
        total: Number(item.total) / 100,
      })),
    }))

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
      count: formattedOrders.length,
    })
  } catch (error: any) {
    console.error("[shop-orders] Error fetching orders:", error)
    console.error("[shop-orders] Error stack:", error.stack)
    return res.status(500).json({
      success: false,
      error: "Помилка отримання замовлень",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
