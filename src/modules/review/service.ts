import { MedusaService } from "@medusajs/framework/utils"
import { Review } from "./models"

/**
 * ReviewModuleService
 *
 * Автоматично отримує методи:
 * - createReviews(data)
 * - updateReviews(selector, data)
 * - deleteReviews(ids)
 * - retrieveReview(id, config)
 * - listReviews(filters, config)
 * - listAndCountReviews(filters, config)
 */
class ReviewModuleService extends MedusaService({
  Review,
}) {
  /**
   * Статистика відгуків для продукту
   */
  async getProductReviewStats(productId: string): Promise<{
    averageRating: number
    count: number
    distribution: Record<number, number>
  }> {
    const reviews = await this.listReviews({
      product_id: productId,
      status: "approved",
    })

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    if (reviews.length === 0) {
      return { averageRating: 0, count: 0, distribution }
    }

    let totalRating = 0
    for (const review of reviews) {
      totalRating += review.rating
      distribution[review.rating] = (distribution[review.rating] || 0) + 1
    }

    return {
      averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
      count: reviews.length,
      distribution,
    }
  }

  /**
   * Перевірка дублікату відгуку (один email — один відгук на продукт)
   */
  async checkDuplicateReview(email: string, productId: string): Promise<boolean> {
    const existing = await this.listReviews({
      email: email.toLowerCase(),
      product_id: productId,
    })
    return existing.length > 0
  }
}

export default ReviewModuleService
