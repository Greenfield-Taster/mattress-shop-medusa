import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/mattresses
 * 
 * Отримує список матраців для сторфронту
 * Підтримує фільтрацію та пагінацію
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Query параметри
  const {
    limit = "12",
    offset = "0",
    hardness,
    block_type,
    min_height,
    max_height,
    min_price,
    max_price,
  } = req.query as Record<string, string>

  try {
    const { data: products, metadata } = await query.graph({
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
      pagination: {
        take: parseInt(limit),
        skip: parseInt(offset),
      },
    })

    // Фільтруємо тільки продукти з mattress_attributes
    let mattresses = products.filter((p: any) => p.mattress_attributes)

    // Додаткова фільтрація по атрибутах матраца
    if (hardness) {
      const hardnessValues = hardness.split(",")
      mattresses = mattresses.filter((m: any) => 
        hardnessValues.includes(m.mattress_attributes.hardness)
      )
    }

    if (block_type) {
      const blockTypes = block_type.split(",")
      mattresses = mattresses.filter((m: any) => 
        blockTypes.includes(m.mattress_attributes.block_type)
      )
    }

    if (min_height) {
      mattresses = mattresses.filter((m: any) => 
        m.mattress_attributes.height >= parseInt(min_height)
      )
    }

    if (max_height) {
      mattresses = mattresses.filter((m: any) => 
        m.mattress_attributes.height <= parseInt(max_height)
      )
    }

    // Форматуємо відповідь для фронтенду
    const formattedMattresses = mattresses.map((product: any) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description,
      thumbnail: product.thumbnail,
      images: product.images?.map((img: any) => img.url) || [],
      
      // Атрибути матраца
      height: product.mattress_attributes?.height,
      hardness: product.mattress_attributes?.hardness,
      blockType: formatBlockType(product.mattress_attributes?.block_type),
      coverType: formatCoverType(product.mattress_attributes?.cover_type),
      maxWeight: product.mattress_attributes?.max_weight,
      fillers: formatFillers(product.mattress_attributes?.fillers || []),
      isNew: product.mattress_attributes?.is_new,
      discountPercent: product.mattress_attributes?.discount_percent,
      
      // Опис
      descriptionMain: product.mattress_attributes?.description_main,
      descriptionCare: product.mattress_attributes?.description_care,
      specs: product.mattress_attributes?.specs || [],

      // Варіанти (розміри з цінами)
      variants: product.variants?.map((v: any) => ({
        id: v.id,
        size: v.title,
        sku: v.sku,
        price: v.prices?.[0]?.amount || 0,
        currency: v.prices?.[0]?.currency_code || "uah",
      })) || [],

      // Мінімальна ціна для відображення в каталозі
      price: getMinPrice(product.variants),
      oldPrice: calculateOldPrice(
        getMinPrice(product.variants), 
        product.mattress_attributes?.discount_percent
      ),
    }))

    res.json({
      mattresses: formattedMattresses,
      count: formattedMattresses.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    })
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    })
  }
}

// ===== HELPERS =====

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
  if (!discountPercent || discountPercent <= 0) return null
  return Math.round(price / (1 - discountPercent / 100))
}
