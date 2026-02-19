import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHOP_ORDER_MODULE } from "../../../modules/order"
import type OrderModuleService from "../../../modules/order/service"

/**
 * GET /admin/shop-orders
 *
 * Отримує список всіх замовлень для адмін панелі
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const orderService = req.scope.resolve<OrderModuleService>(SHOP_ORDER_MODULE)

    // Параметри пагінації
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0
    const status = req.query.status as string | undefined

    // Фільтри
    const filters: Record<string, any> = {}
    if (status) {
      filters.status = status
    }

    // Отримуємо замовлення
    const [orders, count] = await orderService.listAndCountOrders(filters, {
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    })

    // Отримуємо товари для кожного замовлення
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await orderService.listOrderItems({ order_id: order.id })
        return {
          ...order,
          // Конвертуємо суми з копійок в гривні
          subtotal: Number(order.subtotal) / 100,
          discount_amount: Number(order.discount_amount) / 100,
          delivery_price: Number(order.delivery_price) / 100,
          total: Number(order.total) / 100,
          items: items.map((item) => ({
            ...item,
            unit_price: Number(item.unit_price) / 100,
            total: Number(item.total) / 100,
          })),
          items_count: items.reduce((sum, item) => sum + item.quantity, 0),
        }
      })
    )

    return res.status(200).json({
      orders: ordersWithItems,
      count,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[admin/shop-orders] Error:", error)
    return res.status(500).json({
      error: "Помилка отримання замовлень",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
