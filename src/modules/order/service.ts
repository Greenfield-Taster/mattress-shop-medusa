import { MedusaService } from "@medusajs/framework/utils"
import { Order, OrderItem } from "./models"
import type { InferTypeOf } from "@medusajs/framework/types"

// ===== ТИПИ =====

export type OrderType = InferTypeOf<typeof Order>
export type OrderItemType = InferTypeOf<typeof OrderItem>

export interface CreateOrderItemDTO {
  order_id: string
  product_id?: string | null
  variant_id?: string | null
  title: string
  image?: string | null
  size?: string | null
  firmness?: string | null
  unit_price: number
  quantity: number
  total: number
}

export interface CreateOrderDTO {
  // Контактні дані
  full_name: string
  phone: string
  email: string
  comment?: string | null
  customer_id?: string | null

  // Доставка
  delivery_method: string
  delivery_city?: string | null
  delivery_city_ref?: string | null
  delivery_address?: string | null
  delivery_warehouse?: string | null

  // Оплата
  payment_method: string
  payment_status?: string

  // Дані для юр. осіб
  company_name?: string | null
  edrpou?: string | null
  company_address?: string | null

  // Суми
  subtotal: number
  discount_amount?: number
  total: number
  currency?: string

  // Промокод
  promo_code?: string | null
  promo_discount_type?: string | null
  promo_discount_value?: number | null

  // Статус
  status?: string
}

export interface OrderWithItems extends OrderType {
  items: OrderItemType[]
}

/**
 * OrderModuleService
 *
 * Методи MedusaService автоматично генеруються:
 * - createOrders / listOrders / retrieveOrder / updateOrders / deleteOrders
 * - createOrderItems / listOrderItems / retrieveOrderItem / updateOrderItems / deleteOrderItems
 */
class OrderModuleService extends MedusaService({
  Order,
  OrderItem,
}) {
  /**
   * Генерує унікальний номер замовлення
   * Формат: випадкове 8-значне число (10000000 - 99999999)
   */
  async generateOrderNumber(): Promise<string> {
    const MAX_ATTEMPTS = 100

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Випадкове число від 10000000 до 99999999
      const randomNumber = Math.floor(10000000 + Math.random() * 90000000)
      const orderNumber = randomNumber.toString()

      // Перевіряємо унікальність
      const existing = await this.listOrders({ order_number: orderNumber })
      if (existing.length === 0) {
        return orderNumber
      }
    }

    throw new Error("Failed to generate unique order number after 100 attempts")
  }

  /**
   * Створити замовлення з товарами
   */
  async createOrderWithItems(
    orderData: CreateOrderDTO,
    items: Omit<CreateOrderItemDTO, "order_id">[]
  ): Promise<OrderWithItems> {
    // Генеруємо номер замовлення
    const orderNumber = await this.generateOrderNumber()

    // Створюємо замовлення
    const order = await this.createOrders({
      ...orderData,
      order_number: orderNumber,
      status: orderData.status || "pending",
      payment_status: orderData.payment_status || "pending",
      currency: orderData.currency || "UAH",
      discount_amount: orderData.discount_amount || 0,
    })

    // Створюємо товари замовлення
    const orderItems: OrderItemType[] = []
    for (const item of items) {
      const orderItem = await this.createOrderItems({
        ...item,
        order_id: order.id,
      })
      orderItems.push(orderItem)
    }

    return {
      ...order,
      items: orderItems,
    }
  }

  /**
   * Отримати замовлення з товарами
   */
  async getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
    try {
      const order = await this.retrieveOrder(orderId)
      if (!order) return null

      const items = await this.listOrderItems({ order_id: orderId })

      return {
        ...order,
        items,
      }
    } catch {
      return null
    }
  }

  /**
   * Отримати замовлення за номером
   */
  async findByOrderNumber(orderNumber: string): Promise<OrderWithItems | null> {
    try {
      const orders = await this.listOrders({ order_number: orderNumber })
      if (orders.length === 0) return null

      const order = orders[0]
      const items = await this.listOrderItems({ order_id: order.id })

      return {
        ...order,
        items,
      }
    } catch {
      return null
    }
  }

  /**
   * Отримати замовлення користувача
   */
  async getCustomerOrders(customerId: string): Promise<OrderWithItems[]> {
    const orders = await this.listOrders(
      { customer_id: customerId },
      { order: { created_at: "DESC" } }
    )

    const ordersWithItems: OrderWithItems[] = []

    for (const order of orders) {
      const items = await this.listOrderItems({ order_id: order.id })
      ordersWithItems.push({
        ...order,
        items,
      })
    }

    return ordersWithItems
  }

  /**
   * Отримати замовлення за телефоном (для гостьових)
   */
  async getOrdersByPhone(phone: string): Promise<OrderWithItems[]> {
    const orders = await this.listOrders(
      { phone },
      { order: { created_at: "DESC" } }
    )

    const ordersWithItems: OrderWithItems[] = []

    for (const order of orders) {
      const items = await this.listOrderItems({ order_id: order.id })
      ordersWithItems.push({
        ...order,
        items,
      })
    }

    return ordersWithItems
  }

  /**
   * Оновити статус замовлення
   */
  async updateOrderStatus(
    orderId: string,
    status: string,
    adminNotes?: string
  ): Promise<OrderType> {
    return await this.updateOrders({
      id: orderId,
      status,
      admin_notes: adminNotes,
    })
  }

  /**
   * Оновити статус оплати
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string
  ): Promise<OrderType> {
    return await this.updateOrders({
      id: orderId,
      payment_status: paymentStatus,
    })
  }

  /**
   * Скасувати замовлення
   */
  async cancelOrder(orderId: string, reason?: string): Promise<OrderType> {
    return await this.updateOrders({
      id: orderId,
      status: "cancelled",
      admin_notes: reason || "Скасовано",
    })
  }

  /**
   * Перевірити чи email має підтверджену покупку конкретного продукту.
   * Шукає замовлення зі статусом delivered/shipping, що містять product_id.
   */
  async hasVerifiedPurchase(email: string, productId: string): Promise<boolean> {
    // Знаходимо замовлення з відповідним email і статусом
    const deliveredOrders = await this.listOrders(
      { email, status: "delivered" },
      { order: { created_at: "DESC" } }
    )
    const shippingOrders = await this.listOrders(
      { email, status: "shipping" },
      { order: { created_at: "DESC" } }
    )

    const orders = [...deliveredOrders, ...shippingOrders]

    for (const order of orders) {
      const items = await this.listOrderItems({ order_id: order.id })
      if (items.some((item: Record<string, any>) => item.product_id === productId)) {
        return true
      }
    }

    return false
  }

  /**
   * Отримати статистику замовлень
   */
  async getOrdersStats(): Promise<{
    total: number
    pending: number
    processing: number
    shipping: number
    delivered: number
    cancelled: number
  }> {
    const [, total] = await this.listAndCountOrders({})
    const [, pending] = await this.listAndCountOrders({ status: "pending" })
    const [, processing] = await this.listAndCountOrders({ status: "processing" })
    const [, shipping] = await this.listAndCountOrders({ status: "shipping" })
    const [, delivered] = await this.listAndCountOrders({ status: "delivered" })
    const [, cancelled] = await this.listAndCountOrders({ status: "cancelled" })

    return {
      total,
      pending,
      processing,
      shipping,
      delivered,
      cancelled,
    }
  }
}

export default OrderModuleService
