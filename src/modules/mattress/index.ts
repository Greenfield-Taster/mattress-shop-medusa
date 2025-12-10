import MattressModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

/**
 * Ідентифікатор модуля для резолюції з контейнера
 * Використання: container.resolve(MATTRESS_MODULE)
 */
export const MATTRESS_MODULE = "mattress"

export default Module(MATTRESS_MODULE, {
  service: MattressModuleService,
})
