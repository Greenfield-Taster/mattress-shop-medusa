import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../../modules/review"
import ReviewModuleService from "../../../../modules/review/service"

/**
 * GET /store/reviews/:productId
 *
 * Отримує схвалені відгуки для продукту + статистику
 *
 * Query params:
 * - sort: newest (default), highest, lowest
 * - limit: number (default 5)
 * - offset: number (default 0)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const reviewService: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const { productId } = req.params

  try {
    const sort = (req.query.sort as string) || "newest"
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 50)
    const offset = parseInt(req.query.offset as string) || 0

    // Визначаємо порядок сортування
    let order: Record<string, string>
    switch (sort) {
      case "highest":
        order = { rating: "DESC", created_at: "DESC" }
        break
      case "lowest":
        order = { rating: "ASC", created_at: "DESC" }
        break
      default:
        order = { created_at: "DESC" }
    }

    // Отримуємо відгуки
    const [reviews, count] = await reviewService.listAndCountReviews(
      {
        product_id: productId,
        status: "approved",
      },
      {
        order,
        skip: offset,
        take: limit,
      }
    )

    // Отримуємо статистику
    const stats = await reviewService.getProductReviewStats(productId)

    res.json({
      reviews: reviews.map((review: Record<string, any>) => ({
        id: review.id,
        name: review.name,
        rating: review.rating,
        comment: review.comment,
        is_verified_purchase: review.is_verified_purchase,
        created_at: review.created_at,
      })),
      stats,
      count,
      offset,
      limit,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(400).json({ error: errorMessage })
  }
}
