import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHOP_ORDER_MODULE } from "../../../modules/order"
import type OrderModuleService from "../../../modules/order/service"
import { CUSTOMER_MODULE } from "../../../modules/customer"
import type CustomerModuleService from "../../../modules/customer/service"
import { PROMO_CODE_MODULE } from "../../../modules/promo-code"
import type PromoCodeModuleService from "../../../modules/promo-code/service"
import { extractBearerToken, verifyToken } from "../../../utils/jwt"
import { normalizePhoneNumber } from "../../../services/sms"

// Вимикаємо вбудовану авторизацію MedusaJS - використовуємо власну JWT авторизацію
export const AUTHENTICATE = false

// ===== ТИПИ =====

interface OrderItemInput {
  id?: string | number
  product_id?: string
  variant_id?: string
  title: string
  image?: string
  size?: string
  firmness?: string
  price: number
  qty: number
}

interface CreateOrderBody {
  // Контактні дані
  contactData: {
    fullName: string
    phone: string
    email: string
    comment?: string
    createAccount?: boolean
  }

  // Доставка
  deliveryMethod: string
  deliveryCity?: string
  deliveryCityRef?: string
  deliveryAddress?: string
  deliveryWarehouse?: string

  // Оплата
  paymentMethod: string
  paymentData?: {
    // Для карткової оплати (не зберігаємо!)
    cardNumber?: string
    cardExpiry?: string
    cardCvv?: string
    cardHolder?: string
    // Для юридичних осіб
    companyName?: string
    edrpou?: string
    companyAddress?: string
  }

  // Кошик
  items: OrderItemInput[]

  // Суми (ігноруються — сервер перераховує самостійно)
  totals?: {
    subtotal: number
    discount: number
    total: number
  }

  // Промокод
  promoCode?: {
    code: string
    discount: number
    type: string
  }
}

/**
 * POST /store/orders
 *
 * Створює нове замовлення
 * Підтримує як авторизованих користувачів, так і гостей
 */
export async function POST(
  req: MedusaRequest<CreateOrderBody>,
  res: MedusaResponse
) {
  try {
    const orderService = req.scope.resolve<OrderModuleService>(SHOP_ORDER_MODULE)
    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)
    const promoCodeService = req.scope.resolve<PromoCodeModuleService>(PROMO_CODE_MODULE)

    const body = req.body

    // ===== ВАЛІДАЦІЯ =====

    // Контактні дані
    if (!body.contactData?.fullName || body.contactData.fullName.length < 2) {
      return res.status(400).json({
        success: false,
        error: "ПІБ обов'язкове (мінімум 2 символи)",
      })
    }

    if (!body.contactData?.phone) {
      return res.status(400).json({
        success: false,
        error: "Номер телефону обов'язковий",
      })
    }

    if (!body.contactData?.email) {
      return res.status(400).json({
        success: false,
        error: "Email обов'язковий",
      })
    }

    // Доставка
    if (!body.deliveryMethod) {
      return res.status(400).json({
        success: false,
        error: "Спосіб доставки обов'язковий",
      })
    }

    // Оплата
    if (!body.paymentMethod) {
      return res.status(400).json({
        success: false,
        error: "Спосіб оплати обов'язковий",
      })
    }

    // Товари
    if (!body.items || body.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Кошик порожній",
      })
    }

    // ===== ПЕРЕВІРКА АВТОРИЗАЦІЇ =====

    let customerId: string | null = null
    const token = extractBearerToken(req.headers.authorization)

    if (token) {
      const payload = verifyToken(token)
      if (payload?.userId) {
        customerId = payload.userId
      }
    }

    // ===== СТВОРЕННЯ АКАУНТУ (якщо вибрано) =====

    if (!customerId && body.contactData.createAccount) {
      try {
        // Нормалізуємо телефон до формату 0XXXXXXXXX
        const normalizedPhone = normalizePhoneNumber(body.contactData.phone)

        // Перевіряємо чи не існує вже
        let customer = await customerService.findByPhone(normalizedPhone)

        if (!customer) {
          // Створюємо нового користувача
          const nameParts = body.contactData.fullName.trim().split(" ")
          customer = await customerService.createCustomer({
            phone: normalizedPhone,
            email: body.contactData.email,
            first_name: nameParts[0] || null,
            last_name: nameParts.slice(1).join(" ") || null,
          })
        }

        customerId = customer.id
      } catch (error) {
        console.error("[orders] Error creating customer:", error)
        // Продовжуємо без створення акаунту
      }
    }

    // ===== SERVER-SIDE РОЗРАХУНОК СУМ =====

    const serverSubtotal = body.items.reduce((sum, item) => {
      return sum + Math.round(Number(item.price) * Number(item.qty) * 100)
    }, 0)

    // ===== ВАЛІДАЦІЯ ПРОМОКОДУ =====

    let promoDiscountType: string | null = null
    let promoDiscountValue: number | null = null
    let serverDiscount = 0

    if (body.promoCode?.code) {
      const validation = await promoCodeService.validatePromoCode(
        body.promoCode.code,
        serverSubtotal
      )

      if (validation.valid && validation.promoCode) {
        promoDiscountType = validation.promoCode.discount_type
        promoDiscountValue = validation.promoCode.discount_value
        serverDiscount = promoCodeService.calculateDiscount(validation.promoCode, serverSubtotal)

        // Інкрементуємо використання промокоду
        await promoCodeService.incrementUsage(validation.promoCode.id)
      }
    }

    const serverTotal = Math.max(serverSubtotal - serverDiscount, 0)

    // ===== СТВОРЕННЯ ЗАМОВЛЕННЯ =====

    const orderData = {
      customer_id: customerId,
      full_name: body.contactData.fullName.trim(),
      phone: normalizePhoneNumber(body.contactData.phone),
      email: body.contactData.email.toLowerCase().trim(),
      comment: body.contactData.comment || null,

      // Доставка
      delivery_method: body.deliveryMethod,
      delivery_city: body.deliveryCity || null,
      delivery_city_ref: body.deliveryCityRef || null,
      delivery_address: body.deliveryAddress || null,
      delivery_warehouse: body.deliveryWarehouse || null,

      // Оплата
      payment_method: body.paymentMethod,
      payment_status: "pending" as const,

      // Дані для юридичних осіб
      company_name: body.paymentData?.companyName || null,
      edrpou: body.paymentData?.edrpou || null,
      company_address: body.paymentData?.companyAddress || null,

      // Суми (в копійках, розраховані на сервері)
      subtotal: serverSubtotal,
      discount_amount: serverDiscount,
      total: serverTotal,

      // Промокод
      promo_code: body.promoCode?.code || null,
      promo_discount_type: promoDiscountType,
      promo_discount_value: promoDiscountValue ? Math.round(promoDiscountValue) : null,
    }

    // Підготовка товарів
    const orderItems = body.items.map((item) => ({
      product_id: item.product_id || (item.id ? String(item.id) : null),
      variant_id: item.variant_id || null,
      title: item.title,
      image: item.image || null,
      size: item.size || null,
      firmness: item.firmness || null,
      unit_price: Math.round(item.price * 100),
      quantity: item.qty,
      total: Math.round(item.price * item.qty * 100),
    }))

    // Створюємо замовлення з товарами
    const order = await orderService.createOrderWithItems(orderData, orderItems)

    // ===== ВІДПОВІДЬ =====

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        total: order.total / 100, // Повертаємо в гривнях
        created_at: order.created_at,
      },
      message: "Замовлення успішно створено",
    })
  } catch (error: any) {
    console.error("[orders] Error creating order:", error)
    return res.status(500).json({
      success: false,
      error: "Помилка створення замовлення",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

/**
 * GET /store/orders
 *
 * Отримує список замовлень авторизованого користувача
 * Потрібна авторизація!
 *
 * ПРИМІТКА: Цей endpoint блокується MedusaJS auth middleware.
 * Використовуйте /shop-orders замість цього.
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

    // Отримуємо замовлення користувача
    const orders = await orderService.getCustomerOrders(payload.userId)

    // Форматуємо відповідь
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      delivery_method: order.delivery_method,
      delivery_city: order.delivery_city,
      delivery_warehouse: order.delivery_warehouse,
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
        price: Number(item.unit_price) / 100,
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
    console.error("[store/orders] Error fetching orders:", error)
    return res.status(500).json({
      success: false,
      error: "Помилка отримання замовлень",
    })
  }
}
