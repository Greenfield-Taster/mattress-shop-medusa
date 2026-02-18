import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../modules/review"
import ReviewModuleService from "../../../modules/review/service"

/**
 * GET /admin/reviews
 *
 * Список відгуків з фільтрацією за статусом
 * Query: status (pending/approved/rejected), limit, offset
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const reviewService: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)

  try {
    const status = req.query.status as string | undefined
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const offset = parseInt(req.query.offset as string) || 0

    const filters: Record<string, any> = {}
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filters.status = status
    }

    const [reviews, count] = await reviewService.listAndCountReviews(
      filters,
      {
        order: { created_at: "DESC" },
        skip: offset,
        take: limit,
      }
    )

    res.json({ reviews, count, offset, limit })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(400).json({ message: errorMessage })
  }
}
