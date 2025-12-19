import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/mattresses
 *
 * Отримує список матраців для сторфронту
 * Підтримує повну фільтрацію, сортування та пагінацію
 *
 * Query параметри:
 * - types[]     - типи матраців ("Пружинні", "Безпружинні", "Дитячі", "Топери", "Скручені")
 * - sizes[]     - розміри ("160×200", "140×200", ...)
 * - blockTypes[] - тип блоку ("Незалежний пружинний блок", "Безпружинний", ...)
 * - fillers[]   - наповнювачі ("Латекс", "Піна з пам'яттю", ...)
 * - covers[]    - тип чохла ("Знімний", "Незнімний")
 * - height      - діапазон висоти ("3-45")
 * - maxWeight   - максимальне навантаження ("<=250")
 * - price       - діапазон цін ("0-50000")
 * - sort        - сортування (default, price-asc, price-desc, new, discount)
 * - page        - номер сторінки (починаючи з 1)
 * - limit       - кількість елементів на сторінці
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Query параметри
  const {
    page = "1",
    limit = "12",
    sort = "default",
    types,
    sizes,
    blockTypes,
    fillers,
    covers,
    height,
    maxWeight,
    price,
  } = req.query as Record<string, string | string[]>

  // Парсимо параметри-масиви
  const parseArrayParam = (param: string | string[] | undefined): string[] => {
    if (!param) return []
    if (Array.isArray(param)) return param
    return param.split(",").filter(Boolean)
  }

  const typesArr = parseArrayParam(types)
  const sizesArr = parseArrayParam(sizes)
  const blockTypesArr = parseArrayParam(blockTypes)
  const fillersArr = parseArrayParam(fillers)
  const coversArr = parseArrayParam(covers)

  // Парсимо пагінацію
  const pageNum = Math.max(1, parseInt(page as string) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 12))

  try {
    // Отримуємо ВСІ продукти для фільтрації на сервері
    // (MedusaJS не підтримує фільтрацію по JSON полях через query.graph)
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
    let mattresses = products.filter((p: any) => p.mattress_attributes)

    // ===== ФІЛЬТРАЦІЯ =====

    // Фільтр по типу матраца (на основі block_type)
    if (typesArr.length > 0) {
      mattresses = mattresses.filter((m: any) => {
        const type = getMattressType(m.mattress_attributes?.block_type)
        return typesArr.includes(type)
      })
    }

    // Фільтр по розмірам (перевіряємо варіанти)
    if (sizesArr.length > 0) {
      mattresses = mattresses.filter((m: any) => {
        const productSizes = m.variants?.map((v: any) => v.title) || []
        return sizesArr.some(size => productSizes.includes(size))
      })
    }

    // Фільтр по типу блоку
    if (blockTypesArr.length > 0) {
      mattresses = mattresses.filter((m: any) => {
        const blockType = formatBlockType(m.mattress_attributes?.block_type)
        return blockTypesArr.includes(blockType)
      })
    }

    // Фільтр по наповнювачах
    if (fillersArr.length > 0) {
      mattresses = mattresses.filter((m: any) => {
        const productFillers = formatFillers(m.mattress_attributes?.fillers || [])
        return fillersArr.some(filler => productFillers.includes(filler))
      })
    }

    // Фільтр по чохлу
    if (coversArr.length > 0) {
      mattresses = mattresses.filter((m: any) => {
        const coverType = formatCoverType(m.mattress_attributes?.cover_type)
        return coversArr.includes(coverType)
      })
    }

    // Фільтр по висоті
    if (height && typeof height === "string") {
      const [minHeight, maxHeight] = height.split("-").map(Number)
      if (!isNaN(minHeight) && !isNaN(maxHeight)) {
        mattresses = mattresses.filter((m: any) => {
          const h = m.mattress_attributes?.height
          return h >= minHeight && h <= maxHeight
        })
      }
    }

    // Фільтр по максимальному навантаженню
    if (maxWeight && typeof maxWeight === "string") {
      const maxWeightValue = parseInt(maxWeight.replace("<=", ""))
      if (!isNaN(maxWeightValue)) {
        mattresses = mattresses.filter((m: any) => {
          return m.mattress_attributes?.max_weight <= maxWeightValue
        })
      }
    }

    // Фільтр по ціні
    if (price && typeof price === "string") {
      const [minPrice, maxPrice] = price.split("-").map(Number)
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        mattresses = mattresses.filter((m: any) => {
          const productPrice = getMinPrice(m.variants)
          return productPrice >= minPrice && productPrice <= maxPrice
        })
      }
    }

    // ===== СОРТУВАННЯ =====
    mattresses = sortMattresses(mattresses, sort as string)

    // Запам'ятовуємо загальну кількість до пагінації
    const total = mattresses.length

    // ===== ПАГІНАЦІЯ =====
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    mattresses = mattresses.slice(startIndex, endIndex)

    // ===== ФОРМАТУВАННЯ ВІДПОВІДІ =====
    const items = mattresses.map((product: any) => formatProduct(product))

    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
    })
  } catch (error: any) {
    console.error("Error fetching mattresses:", error)
    res.status(400).json({
      message: error.message,
    })
  }
}

// ===== HELPERS =====

/**
 * Визначає тип матраца на основі block_type
 */
function getMattressType(blockType: string): string {
  switch (blockType) {
    case "independent_spring":
    case "bonnel_spring":
      return "Пружинні"
    case "springless":
      return "Безпружинні"
    default:
      return "Безпружинні"
  }
}

/**
 * Форматує тип блоку для українського UI
 */
function formatBlockType(type: string): string {
  const labels: Record<string, string> = {
    independent_spring: "Незалежний пружинний блок",
    bonnel_spring: "Залежний пружинний блок",
    springless: "Безпружинний",
  }
  return labels[type] || type
}

/**
 * Форматує тип чохла для українського UI
 */
function formatCoverType(type: string): string {
  const labels: Record<string, string> = {
    removable: "Знімний",
    non_removable: "Незнімний",
  }
  return labels[type] || type
}

/**
 * Форматує наповнювачі для українського UI
 */
function formatFillers(fillers: string[]): string[] {
  const labels: Record<string, string> = {
    latex: "Латекс",
    memory_foam: "Піна з пам'яттю",
    coconut: "Кокосове полотно",
    latex_foam: "Латексована піна",
    felt: "Войлок",
    polyurethane: "Пінополіуретан",
  }
  return fillers.map(f => labels[f] || f)
}

/**
 * Форматує жорсткість для українського UI
 */
function formatHardness(hardness: string): string {
  const labels: Record<string, string> = {
    H1: "Н1 (м'який)",
    H2: "Н2 (середній)",
    H3: "Н3 (вище середнього)",
    H4: "Н4 (жорсткий)",
  }
  return labels[hardness] || hardness
}

/**
 * Отримує мінімальну ціну з варіантів
 */
function getMinPrice(variants: any[]): number {
  if (!variants?.length) return 0
  const prices = variants
    .map(v => v.prices?.[0]?.amount)
    .filter(p => p > 0)
  return prices.length ? Math.min(...prices) : 0
}

/**
 * Розраховує стару ціну на основі знижки
 */
function calculateOldPrice(price: number, discountPercent: number): number | null {
  if (!discountPercent || discountPercent <= 0) return null
  return Math.round(price / (1 - discountPercent / 100))
}

/**
 * Сортує матраци за вказаним критерієм
 */
function sortMattresses(mattresses: any[], sort: string): any[] {
  if (!sort || sort === "default") return mattresses

  const sorted = [...mattresses]

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => getMinPrice(a.variants) - getMinPrice(b.variants))

    case "price-desc":
      return sorted.sort((a, b) => getMinPrice(b.variants) - getMinPrice(a.variants))

    case "new":
      return sorted.sort((a, b) => {
        const aNew = a.mattress_attributes?.is_new ? 1 : 0
        const bNew = b.mattress_attributes?.is_new ? 1 : 0
        return bNew - aNew
      })

    case "discount":
      return sorted.sort((a, b) => {
        const aDiscount = a.mattress_attributes?.discount_percent || 0
        const bDiscount = b.mattress_attributes?.discount_percent || 0
        return bDiscount - aDiscount
      })

    default:
      return sorted
  }
}

/**
 * Форматує продукт для відповіді API
 */
function formatProduct(product: any): object {
  const price = getMinPrice(product.variants)
  const discountPercent = product.mattress_attributes?.discount_percent || 0

  return {
    id: product.id,
    title: product.title,
    name: product.title, // Alias для сумісності з фронтендом
    handle: product.handle,
    description: product.description,
    thumbnail: product.thumbnail,
    image: product.thumbnail, // Alias для сумісності з фронтендом
    images: product.images?.map((img: any) => img.url) || [],

    // Тип матраца (для фільтрації)
    type: getMattressType(product.mattress_attributes?.block_type),

    // Атрибути матраца
    height: product.mattress_attributes?.height,
    hardness: product.mattress_attributes?.hardness,
    blockType: formatBlockType(product.mattress_attributes?.block_type),
    coverType: formatCoverType(product.mattress_attributes?.cover_type),
    cover: formatCoverType(product.mattress_attributes?.cover_type), // Alias
    maxWeight: product.mattress_attributes?.max_weight,
    fillers: formatFillers(product.mattress_attributes?.fillers || []),
    isNew: product.mattress_attributes?.is_new || false,
    discount: discountPercent,
    discountPercent: discountPercent,
    inStock: true, // TODO: підключити до inventory

    // Опис
    descriptionMain: product.mattress_attributes?.description_main,
    descriptionCare: product.mattress_attributes?.description_care,
    description_main: product.mattress_attributes?.description_main, // Alias
    description_care: product.mattress_attributes?.description_care, // Alias
    specs: product.mattress_attributes?.specs || [],

    // Ціни
    price: price,
    oldPrice: calculateOldPrice(price, discountPercent),

    // Варіанти (розміри з цінами)
    variants: product.variants?.map((v: any) => ({
      id: v.id,
      size: v.title,
      sku: v.sku,
      price: v.prices?.[0]?.amount || 0,
      oldPrice: calculateOldPrice(v.prices?.[0]?.amount || 0, discountPercent),
      currency: v.prices?.[0]?.currency_code || "uah",
    })) || [],

    // Розмір за замовчуванням (перший варіант)
    size: product.variants?.[0]?.title || null,
  }
}
