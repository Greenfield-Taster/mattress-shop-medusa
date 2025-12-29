import OrderModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

/**
 * Ідентифікатор модуля для резолюції з контейнера
 * Використання: container.resolve(SHOP_ORDER_MODULE)
 */
export const SHOP_ORDER_MODULE = "shopOrder"

export default Module(SHOP_ORDER_MODULE, {
  service: OrderModuleService,
})
