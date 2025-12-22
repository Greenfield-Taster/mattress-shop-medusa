import PromoCodeModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

/**
 * Ідентифікатор модуля для резолюції з контейнера
 * Використання: container.resolve(PROMO_CODE_MODULE)
 */
export const PROMO_CODE_MODULE = "promoCode"

export default Module(PROMO_CODE_MODULE, {
  service: PromoCodeModuleService,
})
