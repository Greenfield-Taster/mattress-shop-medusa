import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHOP_ORDER_MODULE } from "../../../../modules/order"
import type OrderModuleService from "../../../../modules/order/service"

/**
 * GET /admin/shop-orders/:id
 *
 * Отримує деталі замовлення
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const orderService = req.scope.resolve<OrderModuleService>(SHOP_ORDER_MODULE)

    const order = await orderService.getOrderWithItems(id)

    if (!order) {
      return res.status(404).json({
        error: "Замовлення не знайдено",
      })
    }

    return res.status(200).json({
      order: {
        ...order,
        subtotal: Number(order.subtotal) / 100,
        discount_amount: Number(order.discount_amount) / 100,
        total: Number(order.total) / 100,
        items: order.items.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price) / 100,
          total: Number(item.total) / 100,
        })),
      },
    })
  } catch (error: any) {
    console.error("[admin/shop-orders/:id] GET Error:", error)
    return res.status(500).json({
      error: "Помилка отримання замовлення",
    })
  }
}

/**
 * PUT /admin/shop-orders/:id
 *
 * Оновлює статус замовлення
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const { status, payment_status, admin_notes } = req.body as {
      status?: string
      payment_status?: string
      admin_notes?: string
    }

    const orderService = req.scope.resolve<OrderModuleService>(SHOP_ORDER_MODULE)

    // Перевіряємо чи існує замовлення
    const existingOrder = await orderService.getOrderWithItems(id)
    if (!existingOrder) {
      return res.status(404).json({
        error: "Замовлення не знайдено",
      })
    }

    // Оновлюємо статус
    const updateData: Record<string, any> = {}
    if (status) updateData.status = status
    if (payment_status) updateData.payment_status = payment_status
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes

    if (Object.keys(updateData).length > 0) {
      await orderService.updateOrders({ id, ...updateData })
    }

    // Повертаємо оновлене замовлення
    const updatedOrder = await orderService.getOrderWithItems(id)

    return res.status(200).json({
      success: true,
      order: {
        ...updatedOrder,
        subtotal: Number(updatedOrder!.subtotal) / 100,
        discount_amount: Number(updatedOrder!.discount_amount) / 100,
        total: Number(updatedOrder!.total) / 100,
        items: updatedOrder!.items.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price) / 100,
          total: Number(item.total) / 100,
        })),
      },
    })
  } catch (error: any) {
    console.error("[admin/shop-orders/:id] PUT Error:", error)
    return res.status(500).json({
      error: "Помилка оновлення замовлення",
    })
  }
}
