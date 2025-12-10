import { defineLink } from "@medusajs/framework/utils"
import MattressModule from "../modules/mattress"
import ProductModule from "@medusajs/medusa/product"

/**
 * Link: Product ↔ MattressAttributes
 * 
 * Зв'язує стандартний Product з кастомними атрибутами матраца.
 * Напрямок: Product → MattressAttributes (розширення Product)
 * 
 * Отримання даних:
 * ```ts
 * const { data } = await query.graph({
 *   entity: "product",
 *   fields: ["*", "mattress_attributes.*"],
 *   filters: { id: productId }
 * })
 * ```
 */
export default defineLink(
  ProductModule.linkable.product,
  MattressModule.linkable.mattressAttributes
)
