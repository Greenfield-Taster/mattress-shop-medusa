import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PROMO_CODE_MODULE } from "../../../modules/promo-code"
import PromoCodeModuleService from "../../../modules/promo-code/service"
import type { Logger } from "@medusajs/framework/types"

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
  } catch (error: unknown) {
    const logger: Logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logger.error(`Error fetching promo codes: ${errorMessage}`)
    res.status(400).json({ message: errorMessage })
  }
}

/**
 * Типи для валідованого body (відповідає CreatePromoCodeSchema)
 */
interface CreatePromoCodeBody {
  code: string
  description?: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  min_order_amount: number
  max_uses: number
  starts_at?: string | null
  expires_at?: string | null
  is_active: boolean
}

/**
 * POST /admin/promo-codes
 *
 * Створює новий промокод.
 * Валідація відбувається через Zod middleware (див. middlewares.ts)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const promoCodeService: PromoCodeModuleService = req.scope.resolve(PROMO_CODE_MODULE)
  const logger: Logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    // Body вже валідований і трансформований Zod middleware
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
    } = req.body as CreatePromoCodeBody

    // Перевірка на унікальність коду (бізнес-логіка, не структурна валідація)
    const existing = await promoCodeService.findByCode(code)
    if (existing) {
      return res.status(400).json({ message: "Промокод з таким кодом вже існує" })
    }

    const promoCode = await promoCodeService.createPromoCodes({
      code, // вже uppercase і trimmed завдяки Zod transform
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logger.error(`Error creating promo code: ${errorMessage}`)
    res.status(400).json({ message: errorMessage })
  }
}
