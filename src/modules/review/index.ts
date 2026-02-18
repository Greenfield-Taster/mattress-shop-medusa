import ReviewModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

/**
 * Ідентифікатор модуля для резолюції з контейнера
 * Використання: container.resolve(REVIEW_MODULE)
 */
export const REVIEW_MODULE = "shopReview"

export default Module(REVIEW_MODULE, {
  service: ReviewModuleService,
})
