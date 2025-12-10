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

    // Форматуємо відповідь
    const mattress = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description,
      thumbnail: product.thumbnail,
      images: product.images?.map((img: any) => img.url) || [],
      
      // Атрибути матраца
      height: product.mattress_attributes.height,
      hardness: product.mattress_attributes.hardness,
      blockType: formatBlockType(product.mattress_attributes.block_type),
      blockTypeRaw: product.mattress_attributes.block_type,
      coverType: formatCoverType(product.mattress_attributes.cover_type),
      coverTypeRaw: product.mattress_attributes.cover_type,
      maxWeight: product.mattress_attributes.max_weight,
      fillers: formatFillers(product.mattress_attributes.fillers || []),
      fillersRaw: product.mattress_attributes.fillers || [],
      isNew: product.mattress_attributes.is_new,
      discountPercent: product.mattress_attributes.discount_percent,
      
      // Опис
      description: {
        main: product.mattress_attributes.description_main,
        care: product.mattress_attributes.description_care,
        specs: product.mattress_attributes.specs || [],
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
          product.mattress_attributes.discount_percent
        ),
        currency: v.prices?.[0]?.currency_code || "uah",
      })) || [],

      // Мінімальна ціна
      price: getMinPrice(product.variants),
      oldPrice: calculateOldPrice(
        getMinPrice(product.variants),
        product.mattress_attributes.discount_percent
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
    .filter(p => p > 0)
  return prices.length ? Math.min(...prices) : 0
}

function calculateOldPrice(price: number, discountPercent: number): number | null {
  if (!discountPercent || discountPercent <= 0 || !price) return null
  return Math.round(price / (1 - discountPercent / 100))
}
