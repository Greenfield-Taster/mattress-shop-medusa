import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PROMO_CODE_MODULE } from "../../../../modules/promo-code"
import PromoCodeModuleService from "../../../../modules/promo-code/service"

/**
 * GET /admin/promo-codes/:id
 *
 * Отримує промокод за ID
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const promoCodeService: PromoCodeModuleService = req.scope.resolve(PROMO_CODE_MODULE)
  const { id } = req.params

  try {
    const promoCode = await promoCodeService.retrievePromoCode(id)

    if (!promoCode) {
      return res.status(404).json({ message: "Промокод не знайдено" })
    }

    res.json({ promo_code: promoCode })
  } catch (error: any) {
    console.error("Error fetching promo code:", error)
    res.status(400).json({ message: error.message })
  }
}

/**
 * PUT /admin/promo-codes/:id
 *
 * Оновлює промокод
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const promoCodeService: PromoCodeModuleService = req.scope.resolve(PROMO_CODE_MODULE)
  const { id } = req.params

  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_uses,
      starts_at,
      expires_at,
      is_active,
    } = req.body as {
      code?: string
      description?: string
      discount_type?: "percentage" | "fixed"
      discount_value?: number
      min_order_amount?: number
      max_uses?: number
      starts_at?: string | null
      expires_at?: string | null
      is_active?: boolean
    }

    // Перевірка існування
    const existing = await promoCodeService.retrievePromoCode(id)
    if (!existing) {
      return res.status(404).json({ message: "Промокод не знайдено" })
    }

    // Валідація
    if (discount_type && !["percentage", "fixed"].includes(discount_type)) {
      return res.status(400).json({ message: "Невірний тип знижки" })
    }

    if (discount_value !== undefined && discount_value <= 0) {
      return res.status(400).json({ message: "Значення знижки має бути більше 0" })
    }

    const effectiveDiscountType = discount_type || existing.discount_type
    const effectiveDiscountValue = discount_value ?? existing.discount_value

    if (effectiveDiscountType === "percentage" && effectiveDiscountValue > 100) {
      return res.status(400).json({ message: "Відсоток знижки не може перевищувати 100" })
    }

    // Перевірка унікальності нового коду
    if (code && code.toUpperCase() !== existing.code) {
      const duplicateCode = await promoCodeService.findByCode(code)
      if (duplicateCode) {
        return res.status(400).json({ message: "Промокод з таким кодом вже існує" })
      }
    }

    // Формуємо об'єкт оновлення
    const updateData: Record<string, any> = {}

    if (code !== undefined) updateData.code = code.toUpperCase().trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (discount_type !== undefined) updateData.discount_type = discount_type
    if (discount_value !== undefined) updateData.discount_value = discount_value
    if (min_order_amount !== undefined) updateData.min_order_amount = min_order_amount
    if (max_uses !== undefined) updateData.max_uses = max_uses
    if (starts_at !== undefined) updateData.starts_at = starts_at ? new Date(starts_at) : null
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at) : null
    if (is_active !== undefined) updateData.is_active = is_active

    await promoCodeService.updatePromoCodes({ id }, updateData)

    const updatedPromoCode = await promoCodeService.retrievePromoCode(id)

    res.json({ promo_code: updatedPromoCode })
  } catch (error: any) {
    console.error("Error updating promo code:", error)
    res.status(400).json({ message: error.message })
  }
}

/**
 * DELETE /admin/promo-codes/:id
 *
 * Видаляє промокод
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const promoCodeService: PromoCodeModuleService = req.scope.resolve(PROMO_CODE_MODULE)
  const { id } = req.params

  try {
    // Перевірка існування
    const existing = await promoCodeService.retrievePromoCode(id)
    if (!existing) {
      return res.status(404).json({ message: "Промокод не знайдено" })
    }

    await promoCodeService.deletePromoCodes([id])

    res.json({ success: true, message: "Промокод видалено" })
  } catch (error: any) {
    console.error("Error deleting promo code:", error)
    res.status(400).json({ message: error.message })
  }
}
