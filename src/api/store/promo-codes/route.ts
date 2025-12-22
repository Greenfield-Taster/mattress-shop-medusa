import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PROMO_CODE_MODULE } from "../../../modules/promo-code"
import PromoCodeModuleService from "../../../modules/promo-code/service"

/**
 * POST /store/promo-codes/validate
 *
 * Перевіряє та застосовує промокод
 *
 * Body: { code: string, order_amount: number }
 * Response: { valid: boolean, discount: number, type: string, message?: string }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const promoCodeService: PromoCodeModuleService = req.scope.resolve(PROMO_CODE_MODULE)

  try {
    const { code, order_amount } = req.body as {
      code: string
      order_amount: number
    }

    // Валідація вхідних даних
    if (!code || typeof code !== "string") {
      return res.status(400).json({
        valid: false,
        message: "Код промокоду обов'язковий",
      })
    }

    if (typeof order_amount !== "number" || order_amount < 0) {
      return res.status(400).json({
        valid: false,
        message: "Сума замовлення має бути числом >= 0",
      })
    }

    // Перевірка промокоду
    const validation = await promoCodeService.validatePromoCode(
      code.trim(),
      order_amount
    )

    if (!validation.valid) {
      return res.json({
        valid: false,
        message: validation.error,
      })
    }

    // Розрахунок знижки
    const discount = promoCodeService.calculateDiscount(
      validation.promoCode,
      order_amount
    )

    res.json({
      valid: true,
      discount,
      discount_type: validation.promoCode.discount_type,
      discount_value: validation.promoCode.discount_value,
      code: validation.promoCode.code,
      message:
        validation.promoCode.discount_type === "percentage"
          ? `Знижка ${validation.promoCode.discount_value}%`
          : `Знижка ${validation.promoCode.discount_value / 100} грн`,
    })
  } catch (error: any) {
    console.error("Error validating promo code:", error)
    res.status(400).json({
      valid: false,
      message: "Помилка перевірки промокоду",
    })
  }
}
