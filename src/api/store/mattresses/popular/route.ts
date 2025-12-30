import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  formatProductForStore,
  type ProductWithAttributes,
} from "../../../../utils/mattress-formatters"

/**
 * GET /store/mattresses/popular
 *
 * Отримує популярні матраци для головної сторінки
 *
 * Логіка підбору:
 * 1. Спочатку товари з is_new = true
 * 2. Якщо не вистачає — додаємо останні додані (по created_at)
 * 3. Повертаємо до 6 товарів за замовчуванням
 *
 * Query параметри:
 * - limit - кількість товарів (за замовчуванням 6, максимум 12)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { limit = "6" } = req.query as Record<string, string>
  const limitNum = Math.min(12, Math.max(1, parseInt(limit) || 6))

  try {
    // Отримуємо всі опубліковані продукти з атрибутами матраців
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "status",
        "created_at",
        "thumbnail",
        "images.*",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.prices.*",
        "mattress_attributes.*",
      ],
      filters: {
        status: "published",
      },
    })

    // Фільтруємо тільки продукти з mattress_attributes
    const mattresses = (products as ProductWithAttributes[]).filter(
      (p) => p.mattress_attributes
    )

    // Розділяємо на нові та звичайні
    const newProducts = mattresses.filter(
      (m) => m.mattress_attributes?.is_new === true
    )
    const otherProducts = mattresses.filter(
      (m) => m.mattress_attributes?.is_new !== true
    )

    // Сортуємо "інші" по даті створення (найновіші першими)
    otherProducts.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })

    // Збираємо популярні: спочатку нові, потім останні додані
    const popular: ProductWithAttributes[] = []

    // Додаємо нові товари
    for (const product of newProducts) {
      if (popular.length >= limitNum) break
      popular.push(product)
    }

    // Якщо не вистачає — додаємо останні додані
    for (const product of otherProducts) {
      if (popular.length >= limitNum) break
      // Перевіряємо чи ще не додали цей товар
      if (!popular.find((p) => p.id === product.id)) {
        popular.push(product)
      }
    }

    // Форматуємо для відповіді
    const items = popular.map((product) => formatProductForStore(product))

    res.json({
      items,
      total: items.length,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(400).json({
      message: errorMessage,
    })
  }
}
