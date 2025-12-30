import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  formatBlockType,
  formatCoverType,
  formatFillers,
  getMinPrice,
  calculateDiscountedPrice,
  groupVariantsByCategory,
  normalizeSize,
  type ProductWithAttributes,
} from "../../../../utils/mattress-formatters"

/**
 * GET /store/mattresses/:handle
 *
 * Отримує один матрац по handle для сторінки продукту
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { handle } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
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
        handle,
        status: "published",
      },
    })

    const product = products[0] as ProductWithAttributes | undefined

    if (!product || !product.mattress_attributes) {
      return res.status(404).json({
        message: "Mattress not found",
      })
    }

    const attrs = product.mattress_attributes
    const fillersList: string[] = Array.isArray(attrs.fillers)
      ? attrs.fillers
      : []
    const discountPercent = attrs.discount_percent || 0

    // Форматуємо відповідь
    const mattress = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      thumbnail: product.thumbnail,
      images: product.images?.map((img) => img.url) || [],

      // Атрибути матраца
      height: attrs.height,
      hardness: attrs.hardness,
      blockType: formatBlockType(attrs.block_type),
      blockTypeRaw: attrs.block_type,
      coverType: formatCoverType(attrs.cover_type),
      coverTypeRaw: attrs.cover_type,
      maxWeight: attrs.max_weight,
      fillers: formatFillers(fillersList),
      fillersRaw: fillersList,
      isNew: attrs.is_new,
      discountPercent: discountPercent,

      // Опис
      description: {
        main: attrs.description_main,
        care: attrs.description_care,
        specs: attrs.specs || [],
      },

      // Варіанти (розміри з цінами) - згруповані по категоріях
      variants: groupVariantsByCategory(product.variants),

      // Всі варіанти плоским списком
      allVariants:
        product.variants?.map((v) => {
          const priceArray = v.prices || v.price_set?.prices
          const variantBasePrice = priceArray?.[0]?.amount || 0
          return {
            id: v.id,
            size: normalizeSize(v.title), // Нормалізуємо для сумісності з фронтендом
            sku: v.sku,
            price: calculateDiscountedPrice(variantBasePrice, discountPercent),
            oldPrice: discountPercent > 0 ? variantBasePrice : null,
            currency: priceArray?.[0]?.currency_code || "uah",
          }
        }) || [],

      // Мінімальна ціна (basePrice - з бази, price - зі знижкою)
      price: calculateDiscountedPrice(getMinPrice(product.variants), discountPercent),
      oldPrice: discountPercent > 0 ? getMinPrice(product.variants) : null,
    }

    res.json({ mattress })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    res.status(400).json({
      message: errorMessage,
    })
  }
}
