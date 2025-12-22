import { MedusaService } from "@medusajs/framework/utils"
import PromoCode from "./models/promo-code"

/**
 * PromoCodeModuleService
 *
 * Автоматично отримує методи:
 * - createPromoCodes(data)
 * - updatePromoCodes(selector, data)
 * - deletePromoCodes(ids)
 * - retrievePromoCode(id, config)
 * - listPromoCodes(filters, config)
 * - listAndCountPromoCodes(filters, config)
 */
class PromoCodeModuleService extends MedusaService({
  PromoCode,
}) {
  /**
   * Знайти промокод за кодом
   */
  async findByCode(code: string) {
    const [promoCode] = await this.listPromoCodes({
      code: code.toUpperCase(),
    })
    return promoCode || null
  }

  /**
   * Перевірити валідність промокоду
   */
  async validatePromoCode(
    code: string,
    orderAmount: number
  ): Promise<{
    valid: boolean
    promoCode?: any
    error?: string
  }> {
    const promoCode = await this.findByCode(code)

    if (!promoCode) {
      return { valid: false, error: "Промокод не знайдено" }
    }

    if (!promoCode.is_active) {
      return { valid: false, error: "Промокод неактивний" }
    }

    // Перевірка дат
    const now = new Date()

    if (promoCode.starts_at && new Date(promoCode.starts_at) > now) {
      return { valid: false, error: "Промокод ще не активний" }
    }

    if (promoCode.expires_at && new Date(promoCode.expires_at) < now) {
      return { valid: false, error: "Термін дії промокоду закінчився" }
    }

    // Перевірка кількості використань
    if (promoCode.max_uses > 0 && promoCode.current_uses >= promoCode.max_uses) {
      return { valid: false, error: "Промокод вичерпано" }
    }

    // Перевірка мінімальної суми
    if (promoCode.min_order_amount > 0 && orderAmount < promoCode.min_order_amount) {
      return {
        valid: false,
        error: `Мінімальна сума замовлення: ${promoCode.min_order_amount / 100} грн`,
      }
    }

    return { valid: true, promoCode }
  }

  /**
   * Розрахувати знижку
   */
  calculateDiscount(promoCode: any, orderAmount: number): number {
    if (promoCode.discount_type === "percentage") {
      return Math.round((orderAmount * promoCode.discount_value) / 100)
    }
    // fixed
    return Math.min(promoCode.discount_value, orderAmount)
  }

  /**
   * Збільшити лічильник використань
   */
  async incrementUsage(id: string) {
    const promoCode = await this.retrievePromoCode(id)
    await this.updatePromoCodes(
      { id },
      { current_uses: promoCode.current_uses + 1 }
    )
  }
}

export default PromoCodeModuleService
