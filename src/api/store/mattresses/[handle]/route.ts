import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

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

    const product = products[0]

    if (!product || !product.mattress_attributes) {
      return res.status(404).json({
        message: "Mattress not found",
      })
    }

    const attrs = product.mattress_attributes as any
    const fillersList: string[] = Array.isArray(attrs.fillers) ? attrs.fillers : []

    // Форматуємо відповідь
    const mattress = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      thumbnail: product.thumbnail,
      images: product.images?.map((img: any) => img.url) || [],
      
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
      discountPercent: attrs.discount_percent,
      
      // Опис
      description: {
        main: attrs.description_main,
        care: attrs.description_care,
        specs: attrs.specs || [],
      },

      // Варіанти (розміри з цінами) - згруповані по категоріях
      variants: groupVariantsByCategory(product.variants),
      
      // Всі варіанти плоским списком
      allVariants: product.variants?.map((v: any) => ({
        id: v.id,
        size: v.title,
        sku: v.sku,
        price: v.prices?.[0]?.amount || 0,
        oldPrice: calculateOldPrice(
          v.prices?.[0]?.amount || 0,
          attrs.discount_percent
        ),
        currency: v.prices?.[0]?.currency_code || "uah",
      })) || [],

      // Мінімальна ціна
      price: getMinPrice(product.variants),
      oldPrice: calculateOldPrice(
        getMinPrice(product.variants),
        attrs.discount_percent
      ),
    }

    res.json({ mattress })
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    })
  }
}

// ===== HELPERS =====

const SIZE_CATEGORIES: Record<string, string[]> = {
  "Дитячий": ["60×120", "70×140", "70×160"],
  "Односпальний": ["80×190", "80×200", "90×190", "90×200"],
  "Полуторний": ["120×190", "120×200"],
  "Двоспальний": ["140×190", "140×200", "160×190", "160×200"],
  "King Size": ["180×190", "180×200"],
  "King Size XL": ["200×200"],
}

function groupVariantsByCategory(variants: any[]) {
  if (!variants?.length) return {}

  const result: Record<string, any[]> = {}

  for (const [category, sizes] of Object.entries(SIZE_CATEGORIES)) {
    const categoryVariants = variants
      .filter(v => sizes.includes(v.title))
      .map(v => ({
        id: v.id,
        size: v.title,
        price: v.prices?.[0]?.amount || 0,
        currency: v.prices?.[0]?.currency_code || "uah",
      }))

    if (categoryVariants.length > 0) {
      result[category] = categoryVariants
    }
  }

  return result
}

function formatBlockType(type: string): string {
  const labels: Record<string, string> = {
    independent_spring: "Незалежний пружинний блок",
    bonnel_spring: "Залежний пружинний блок",
    springless: "Безпружинний",
  }
  return labels[type] || type
}

function formatCoverType(type: string): string {
  const labels: Record<string, string> = {
    removable: "Знімний",
    non_removable: "Незнімний",
  }
  return labels[type] || type
}

function formatFillers(fillers: string[]): string[] {
  const labels: Record<string, string> = {
    latex: "Латекс",
    memory_foam: "Піна з пам'яттю",
    coconut: "Кокосове волокно",
    latex_foam: "Латексована піна",
    felt: "Войлок",
    polyurethane: "Пінополіуретан",
  }
  return fillers.map(f => labels[f] || f)
}

function getMinPrice(variants: any[]): number {
  if (!variants?.length) return 0
  const prices = variants
    .map(v => v.prices?.[0]?.amount)
    .filter((p): p is number => p != null && p > 0)
  return prices.length ? Math.min(...prices) : 0
}

function calculateOldPrice(price: number, discountPercent: number | null | undefined): number | null {
  if (!discountPercent || discountPercent <= 0 || !price) return null
  return Math.round(price / (1 - discountPercent / 100))
}
