/**
 * Спільні helper-функції для форматування даних матраців
 *
 * Використовується в:
 * - src/api/store/mattresses/route.ts
 * - src/api/store/mattresses/[handle]/route.ts
 */

// ===== ТИПИ =====

export interface ProductVariant {
  id: string
  title: string
  sku?: string
  prices?: Array<{
    amount: number
    currency_code: string
  }>
  price_set?: {
    prices?: Array<{
      amount: number
      currency_code: string
    }>
  }
}

export interface MattressAttributesData {
  height?: number
  hardness?: string
  block_type?: string
  cover_type?: string
  max_weight?: number
  fillers?: string[] | Record<string, unknown>
  description_main?: string
  description_care?: string
  specs?: string[] | Record<string, unknown>
  certificates?: Array<{ title: string; image: string; description?: string }> | null
  is_new?: boolean
  discount_percent?: number
  product_type?: string | null
}

export interface ProductWithAttributes {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string
  images?: Array<{ url: string }>
  variants?: ProductVariant[]
  mattress_attributes?: MattressAttributesData
  created_at?: string
}

// ===== КОНСТАНТИ =====

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  independent_spring: "Незалежний пружинний блок",
  bonnel_spring: "Залежний пружинний блок",
  springless: "Безпружинний",
}

export const COVER_TYPE_LABELS: Record<string, string> = {
  removable: "Знімний",
  non_removable: "Незнімний",
}

export const FILLER_LABELS: Record<string, string> = {
  latex: "Латекс",
  memory_foam: "Піна з пам'яттю",
  coconut: "Кокосове полотно",
  latex_foam: "Латексована піна",
}


// 29 стандартних розмірів (синхронізовано з MattressQuiz на фронтенді)
export const SIZE_CATEGORIES: Record<string, string[]> = {
  // Дитячі: 8 розмірів
  "Дитячий": [
    "60×120",
    "70×140", "70×150", "70×160", "70×170", "70×180", "70×190", "70×200",
  ],
  // Односпальні: 8 розмірів
  "Односпальний": [
    "80×150", "80×160", "80×170", "80×180", "80×190", "80×200",
    "90×190", "90×200",
  ],
  // Полуторні: 2 розміри
  "Полуторний": ["120×190", "120×200"],
  // Двоспальні: 8 розмірів
  "Двоспальний": [
    "140×190", "140×200",
    "150×190", "150×200",
    "160×190", "160×200",
    "170×190", "170×200",
  ],
  // King Size: 2 розміри
  "King Size": ["180×190", "180×200"],
  // King Size XL: 1 розмір
  "King Size XL": ["200×200"],
}

// ===== НОРМАЛІЗАЦІЯ =====

/**
 * Нормалізує розмір матраца для порівняння
 * Замінює різні варіанти символу "x" на кирилічний "х"
 * Фронтенд використовує "160х200" (кирилиця)
 */
export function normalizeSize(size: string): string {
  if (!size) return ""
  // Замінюємо Unicode × (U+00D7) та латинський x на кирилічний х
  return size.replace(/[×xXхХ]/g, "х")
}

// ===== ФОРМАТУВАННЯ =====

/**
 * Визначає тип матраца (повертає сирий ключ)
 * Пріоритет: product_type (якщо задано) → fallback по block_type
 */
export function getMattressType(blockType: string | undefined, productType?: string | null): string {
  if (productType) {
    return productType
  }
  switch (blockType) {
    case "independent_spring":
    case "bonnel_spring":
      return "spring"
    case "springless":
      return "springless"
    default:
      return "springless"
  }
}

/**
 * Форматує тип блоку для українського UI
 */
export function formatBlockType(type: string | undefined): string {
  if (!type) return ""
  return BLOCK_TYPE_LABELS[type] || type
}

/**
 * Форматує тип чохла для українського UI
 */
export function formatCoverType(type: string | undefined): string {
  if (!type) return ""
  return COVER_TYPE_LABELS[type] || type
}

/**
 * Витягує наповнювачі як масив сирих ключів (без перекладу)
 * Підтримує як масив, так і Record (JSON з бази даних)
 */
export function extractFillers(fillers: string[] | Record<string, unknown> | undefined): string[] {
  if (!fillers) return []
  if (Array.isArray(fillers)) return fillers
  if (typeof fillers === 'object') {
    const values = Object.values(fillers)
    if (values.every(v => typeof v === 'string')) {
      return values as string[]
    }
  }
  return []
}

/**
 * Форматує наповнювачі для українського UI (використовується в admin)
 */
export function formatFillers(fillers: string[] | Record<string, unknown> | undefined): string[] {
  return extractFillers(fillers).map(f => FILLER_LABELS[f] || f)
}


// ===== ЦІНИ =====

/**
 * Отримує мінімальну ціну з варіантів
 */
export function getMinPrice(variants: ProductVariant[] | undefined): number {
  if (!variants?.length) return 0

  const prices = variants
    .map(v => {
      // Підтримуємо обидва формати: prices та price_set.prices
      const priceArray = v.prices || v.price_set?.prices
      return priceArray?.[0]?.amount
    })
    .filter((p): p is number => p != null && p > 0)

  return prices.length ? Math.min(...prices) : 0
}

/**
 * Розраховує ціну зі знижкою
 * basePrice - базова ціна товару (стара ціна)
 * discountPercent - відсоток знижки
 * Повертає ціну після застосування знижки
 */
export function calculateDiscountedPrice(
  basePrice: number,
  discountPercent: number | null | undefined
): number {
  if (!discountPercent || discountPercent <= 0 || !basePrice) return basePrice
  return Math.round(basePrice * (1 - discountPercent / 100))
}

// ===== ГРУПУВАННЯ =====

/**
 * Групує варіанти за категоріями розмірів
 */
export function groupVariantsByCategory(variants: ProductVariant[] | undefined): Record<string, Array<{
  id: string
  size: string
  price: number
  currency: string
}>> {
  if (!variants?.length) return {}

  const result: Record<string, Array<{
    id: string
    size: string
    price: number
    currency: string
  }>> = {}

  for (const [category, sizes] of Object.entries(SIZE_CATEGORIES)) {
    // Нормалізуємо розміри категорій для порівняння
    const normalizedCategorySizes = sizes.map(normalizeSize)
    const categoryVariants = variants
      .filter(v => normalizedCategorySizes.includes(normalizeSize(v.title)))
      .map(v => {
        const priceArray = v.prices || v.price_set?.prices
        return {
          id: v.id,
          size: normalizeSize(v.title), // Нормалізуємо для фронтенду
          price: priceArray?.[0]?.amount || 0,
          currency: priceArray?.[0]?.currency_code || "uah",
        }
      })

    if (categoryVariants.length > 0) {
      result[category] = categoryVariants
    }
  }

  return result
}

// ===== СОРТУВАННЯ =====

/**
 * Сортує матраци за вказаним критерієм
 */
export function sortMattresses(
  mattresses: ProductWithAttributes[],
  sort: string
): ProductWithAttributes[] {
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

// ===== ФОРМАТУВАННЯ ПРОДУКТУ =====

/**
 * Форматує продукт для відповіді Store API
 */
export function formatProductForStore(product: ProductWithAttributes): object {
  const price = getMinPrice(product.variants)
  const discountPercent = product.mattress_attributes?.discount_percent || 0
  const attrs = product.mattress_attributes

  return {
    id: product.id,
    title: product.title,
    name: product.title, // Alias для сумісності з фронтендом
    handle: product.handle,
    description: product.description,
    thumbnail: product.thumbnail,
    image: product.thumbnail, // Alias для сумісності з фронтендом
    images: product.images?.map(img => img.url) || [],

    // Тип матраца (для фільтрації)
    type: getMattressType(attrs?.block_type, attrs?.product_type),

    // Атрибути матраца (сирі ключі — фронтенд перекладає)
    height: attrs?.height,
    hardness: attrs?.hardness,
    blockType: attrs?.block_type || "",
    coverType: attrs?.cover_type || "",
    maxWeight: attrs?.max_weight,
    fillers: extractFillers(attrs?.fillers),
    isNew: attrs?.is_new || false,
    discount: discountPercent,
    discountPercent: discountPercent,
    inStock: true, // TODO: підключити до inventory

    // Опис
    descriptionMain: attrs?.description_main,
    descriptionCare: attrs?.description_care,
    description_main: attrs?.description_main, // Alias
    description_care: attrs?.description_care, // Alias
    specs: attrs?.specs || [],

    // Ціни (basePrice - ціна з бази, price - ціна зі знижкою)
    price: calculateDiscountedPrice(price, discountPercent),
    oldPrice: discountPercent > 0 ? price : null,

    // Варіанти (розміри з цінами)
    variants: product.variants?.map(v => {
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

    // Розмір за замовчуванням (перший варіант)
    size: normalizeSize(product.variants?.[0]?.title || ""),
  }
}
