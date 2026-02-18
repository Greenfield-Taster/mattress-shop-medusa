import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../../modules/review"
import ReviewModuleService from "../../../../modules/review/service"

/**
 * GET /admin/reviews/:id
 *
 * Отримує відгук за ID
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const reviewService: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const { id } = req.params

  try {
    const review = await reviewService.retrieveReview(id)
    if (!review) {
      return res.status(404).json({ message: "Відгук не знайдено" })
    }
    res.json({ review })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(400).json({ message: errorMessage })
  }
}

/**
 * PUT /admin/reviews/:id
 *
 * Оновлює відгук (approve/reject)
 * Body: { status: "approved" | "rejected" }
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const reviewService: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const { id } = req.params

  try {
    const { status } = req.body as { status?: string }

    const existing = await reviewService.retrieveReview(id)
    if (!existing) {
      return res.status(404).json({ message: "Відгук не знайдено" })
    }

    if (status && !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Невірний статус. Допустимі: pending, approved, rejected" })
    }

    const updateData: Record<string, any> = {}
    if (status !== undefined) updateData.status = status

    await reviewService.updateReviews([{ id, ...updateData }])
    const updated = await reviewService.retrieveReview(id)

    res.json({ review: updated })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(400).json({ message: errorMessage })
  }
}

/**
 * DELETE /admin/reviews/:id
 *
 * Видаляє відгук
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const reviewService: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const { id } = req.params

  try {
    const existing = await reviewService.retrieveReview(id)
    if (!existing) {
      return res.status(404).json({ message: "Відгук не знайдено" })
    }

    await reviewService.deleteReviews([id])
    res.json({ success: true, message: "Відгук видалено" })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(400).json({ message: errorMessage })
  }
}
