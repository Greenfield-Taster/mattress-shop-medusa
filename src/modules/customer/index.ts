import CustomerModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

/**
 * Ідентифікатор модуля для резолюції з контейнера
 * Використання: container.resolve(CUSTOMER_MODULE)
 */
export const CUSTOMER_MODULE = "shopCustomer"

export default Module(CUSTOMER_MODULE, {
  service: CustomerModuleService,
})
