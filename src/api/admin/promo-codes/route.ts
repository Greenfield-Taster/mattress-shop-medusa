import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PROMO_CODE_MODULE } from "../../../modules/promo-code"
import PromoCodeModuleService from "../../../modules/promo-code/service"

/**
 * GET /admin/promo-codes
 *
 * Отримує список всіх промокодів
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const promoCodeService: PromoCodeModuleService = req.scope.resolve(PROMO_CODE_MODULE)

  try {
    const promoCodes = await promoCodeService.listPromoCodes(
      {},
      {
        order: { created_at: "DESC" },
      }
    )

    res.json({ promo_codes: promoCodes })
  } catch (error: any) {
    console.error("Error fetching promo codes:", error)
    res.status(400).json({ message: error.message })
  }
}

/**
 * POST /admin/promo-codes
 *
 * Створює новий промокод
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const promoCodeService: PromoCodeModuleService = req.scope.resolve(PROMO_CODE_MODULE)

  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount = 0,
      max_uses = 0,
      starts_at,
      expires_at,
      is_active = true,
    } = req.body as {
      code: string
      description?: string
      discount_type: "percentage" | "fixed"
      discount_value: number
      min_order_amount?: number
      max_uses?: number
      starts_at?: string
      expires_at?: string
      is_active?: boolean
    }

    // Валідація
    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Код промокоду обов'язковий" })
    }

    if (!discount_type || !["percentage", "fixed"].includes(discount_type)) {
      return res.status(400).json({ message: "Невірний тип знижки" })
    }

    if (typeof discount_value !== "number" || discount_value <= 0) {
      return res.status(400).json({ message: "Значення знижки має бути більше 0" })
    }

    if (discount_type === "percentage" && discount_value > 100) {
      return res.status(400).json({ message: "Відсоток знижки не може перевищувати 100" })
    }

    // Перевірка на унікальність коду
    const existing = await promoCodeService.findByCode(code)
    if (existing) {
      return res.status(400).json({ message: "Промокод з таким кодом вже існує" })
    }

    const promoCode = await promoCodeService.createPromoCodes({
      code: code.toUpperCase().trim(),
      description: description?.trim() || null,
      discount_type,
      discount_value,
      min_order_amount,
      max_uses,
      current_uses: 0,
      starts_at: starts_at ? new Date(starts_at) : null,
      expires_at: expires_at ? new Date(expires_at) : null,
      is_active,
    })

    res.status(201).json({ promo_code: promoCode })
  } catch (error: any) {
    console.error("Error creating promo code:", error)
    res.status(400).json({ message: error.message })
  }
}
