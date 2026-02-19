import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../modules/review"
import ReviewModuleService from "../../../modules/review/service"
import { SHOP_ORDER_MODULE } from "../../../modules/order"
import OrderModuleService from "../../../modules/order/service"
import { verifyToken, extractBearerToken } from "../../../utils/jwt"

/**
 * POST /store/reviews
 *
 * Створює новий відгук (статус: pending)
 * Body: { product_id, name, email, rating, comment }
 * Валідація через Zod middleware (див. middlewares.ts)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const reviewService: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const orderService: OrderModuleService = req.scope.resolve(SHOP_ORDER_MODULE)

  try {
    const { product_id, name, email, rating, comment } = req.body as {
      product_id: string
      name: string
      email: string
      rating: number
      comment: string
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Перевірка дублікату
    const isDuplicate = await reviewService.checkDuplicateReview(normalizedEmail, product_id)
    if (isDuplicate) {
      return res.status(400).json({
        error: "Ви вже залишили відгук для цього товару",
      })
    }

    // Перевірка чи користувач купував цей продукт
    let isVerifiedPurchase = false
    let customerId: string | null = null

    // Спробуємо отримати customer_id з JWT
    const token = extractBearerToken(req.headers.authorization || "")
    if (token) {
      const payload = verifyToken(token)
      if (payload?.userId) {
        customerId = payload.userId
      }
    }

    // Перевіряємо чи є замовлення з цим email та продуктом
    try {
      const orders = await orderService.listOrders({ email: normalizedEmail })
      for (const order of orders) {
        if (order.status === "delivered" || order.status === "shipping") {
          const items = await orderService.listOrderItems({ order_id: order.id })
          if (items.some((item: Record<string, any>) => item.product_id === product_id)) {
            isVerifiedPurchase = true
            break
          }
        }
      }
    } catch {
      // Помилка перевірки — продовжуємо без позначки
    }

    const review = await reviewService.createReviews({
      product_id,
      customer_id: customerId,
      name: name.trim(),
      email: normalizedEmail,
      rating,
      comment: comment.trim(),
      is_verified_purchase: isVerifiedPurchase,
      status: "pending",
    })

    res.status(201).json({
      review: {
        id: review.id,
        status: review.status,
      },
      message: "Дякуємо! Ваш відгук буде опублікований після модерації",
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Обробка помилки унікального індексу (дублікат)
    if (errorMessage.includes("unique") || errorMessage.includes("duplicate")) {
      return res.status(400).json({
        error: "Ви вже залишили відгук для цього товару",
      })
    }

    res.status(400).json({ error: errorMessage })
  }
}
