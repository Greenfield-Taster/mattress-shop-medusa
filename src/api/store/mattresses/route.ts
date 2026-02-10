import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  getMattressType,
  formatBlockType,
  formatCoverType,
  formatFillers,
  getMinPrice,
  sortMattresses,
  formatProductForStore,
  normalizeSize,
  type ProductWithAttributes,
} from "../../../utils/mattress-formatters"

/**
 * GET /store/mattresses
 *
 * Отримує список матраців для сторфронту
 * Підтримує повну фільтрацію, сортування та пагінацію
 *
 * Query параметри:
 * - types[]     - типи матраців ("Пружинні", "Безпружинні", "Дитячі", "Топери", "Скручені")
 * - sizes[]     - розміри ("160×200", "140×200", ...)
 * - hardness[]  - жорсткість ("H1", "H2", "H3", "H4", "H5")
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
    hardness,
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
  const hardnessArr = parseArrayParam(hardness)
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
    let mattresses = (products as ProductWithAttributes[]).filter(
      (p) => p.mattress_attributes
    )

    // ===== ФІЛЬТРАЦІЯ =====

    // Фільтр по типу матраца (product_type з fallback на block_type)
    if (typesArr.length > 0) {
      mattresses = mattresses.filter((m) => {
        const type = getMattressType(m.mattress_attributes?.block_type, m.mattress_attributes?.product_type)
        return typesArr.includes(type)
      })
    }

    // Фільтр по жорсткості
    if (hardnessArr.length > 0) {
      mattresses = mattresses.filter((m) => {
        const h = m.mattress_attributes?.hardness
        return h !== undefined && hardnessArr.includes(h)
      })
    }

    // Фільтр по розмірам (перевіряємо варіанти)
    // "нестандартний розмір" або "custom" показує всі матраци (бо всі можуть бути на замовлення)
    if (sizesArr.length > 0) {
      const hasCustomSize = sizesArr.some(s =>
        s.toLowerCase() === "нестандартний розмір" ||
        s.toLowerCase() === "custom" ||
        normalizeSize(s) === "нестандартний розмір"
      )

      // Якщо вибрано ТІЛЬКИ нестандартний розмір - показуємо всі матраци
      if (hasCustomSize && sizesArr.length === 1) {
        // Пропускаємо фільтр - показуємо всі
      } else {
        // Фільтруємо по стандартних розмірах
        const standardSizes = sizesArr.filter(s =>
          s.toLowerCase() !== "нестандартний розмір" &&
          s.toLowerCase() !== "custom"
        )

        if (standardSizes.length > 0) {
          const normalizedFilterSizes = standardSizes.map(normalizeSize)
          mattresses = mattresses.filter((m) => {
            const productSizes = m.variants?.map((v) => normalizeSize(v.title)) || []
            return normalizedFilterSizes.some((size) => productSizes.includes(size))
          })
        }
      }
    }

    // Фільтр по типу блоку
    if (blockTypesArr.length > 0) {
      mattresses = mattresses.filter((m) => {
        const blockType = formatBlockType(m.mattress_attributes?.block_type)
        return blockTypesArr.includes(blockType)
      })
    }

    // Фільтр по наповнювачах
    if (fillersArr.length > 0) {
      mattresses = mattresses.filter((m) => {
        const productFillers = formatFillers(m.mattress_attributes?.fillers)
        return fillersArr.some((filler) => productFillers.includes(filler))
      })
    }

    // Фільтр по чохлу
    if (coversArr.length > 0) {
      mattresses = mattresses.filter((m) => {
        const coverType = formatCoverType(m.mattress_attributes?.cover_type)
        return coversArr.includes(coverType)
      })
    }

    // Фільтр по висоті
    if (height && typeof height === "string") {
      const [minHeight, maxHeight] = height.split("-").map(Number)
      if (!isNaN(minHeight) && !isNaN(maxHeight)) {
        mattresses = mattresses.filter((m) => {
          const h = m.mattress_attributes?.height
          return h !== undefined && h >= minHeight && h <= maxHeight
        })
      }
    }

    // Фільтр по максимальному навантаженню
    if (maxWeight && typeof maxWeight === "string") {
      const maxWeightValue = parseInt(maxWeight.replace("<=", ""))
      if (!isNaN(maxWeightValue)) {
        mattresses = mattresses.filter((m) => {
          const weight = m.mattress_attributes?.max_weight
          return weight !== undefined && weight <= maxWeightValue
        })
      }
    }

    // Фільтр по ціні
    if (price && typeof price === "string") {
      const [minPrice, maxPrice] = price.split("-").map(Number)
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        mattresses = mattresses.filter((m) => {
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
    const items = mattresses.map((product) => formatProductForStore(product))

    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(400).json({
      message: errorMessage,
    })
  }
}
