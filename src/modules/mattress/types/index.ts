/**
 * Типи жорсткості матраца
 */
export const HARDNESS_OPTIONS = {
  H1: { value: "H1", label: "H1 (м'який)" },
  H2: { value: "H2", label: "H2 (нижче середньої)" },
  H3: { value: "H3", label: "H3 (середня)" },
  H4: { value: "H4", label: "H4 (жорсткий)" },
} as const

export type HardnessType = keyof typeof HARDNESS_OPTIONS

/**
 * Типи блоків матраца
 * Синхронізовано з фронтендом (Catalog.jsx filterOptions.blockTypes)
 */
export const BLOCK_TYPE_OPTIONS = {
  springless: {
    value: "springless",
    label: "Безпружинний"
  },
  independent_spring: {
    value: "independent_spring",
    label: "Незалежний пружинний блок"
  },
} as const

export type BlockType = keyof typeof BLOCK_TYPE_OPTIONS

/**
 * Типи чохлів
 */
export const COVER_TYPE_OPTIONS = {
  removable: { value: "removable", label: "Знімний" },
  non_removable: { value: "non_removable", label: "Незнімний" },
} as const

export type CoverType = keyof typeof COVER_TYPE_OPTIONS

/**
 * Доступні наповнювачі
 * Синхронізовано з фронтендом (Catalog.jsx filterOptions.fillers)
 */
export const FILLER_OPTIONS = {
  latex: { value: "latex", label: "Латекс" },
  latex_foam: { value: "latex_foam", label: "Латексована піна" },
  memory_foam: { value: "memory_foam", label: "Піна з пам'яттю" },
  coconut: { value: "coconut", label: "Кокосове полотно" },
} as const

export type FillerType = keyof typeof FILLER_OPTIONS

/**
 * Стандартні розміри матраців (29 розмірів)
 * Синхронізовано з MattressQuiz на фронтенді
 */
export const MATTRESS_SIZES = [
  // Дитячі (8 розмірів)
  { size: "60×120", category: "child", label: "Дитячий" },
  { size: "70×140", category: "child", label: "Дитячий" },
  { size: "70×150", category: "child", label: "Дитячий" },
  { size: "70×160", category: "child", label: "Дитячий" },
  { size: "70×170", category: "child", label: "Дитячий" },
  { size: "70×180", category: "child", label: "Дитячий" },
  { size: "70×190", category: "child", label: "Дитячий" },
  { size: "70×200", category: "child", label: "Дитячий" },
  // Односпальні (8 розмірів)
  { size: "80×150", category: "single", label: "Односпальний" },
  { size: "80×160", category: "single", label: "Односпальний" },
  { size: "80×170", category: "single", label: "Односпальний" },
  { size: "80×180", category: "single", label: "Односпальний" },
  { size: "80×190", category: "single", label: "Односпальний" },
  { size: "80×200", category: "single", label: "Односпальний" },
  { size: "90×190", category: "single", label: "Односпальний" },
  { size: "90×200", category: "single", label: "Односпальний" },
  // Полуторні (2 розміри)
  { size: "120×190", category: "semi_double", label: "Полуторний" },
  { size: "120×200", category: "semi_double", label: "Полуторний" },
  // Двоспальні (8 розмірів)
  { size: "140×190", category: "double", label: "Двоспальний" },
  { size: "140×200", category: "double", label: "Двоспальний" },
  { size: "150×190", category: "double", label: "Двоспальний" },
  { size: "150×200", category: "double", label: "Двоспальний" },
  { size: "160×190", category: "double", label: "Двоспальний" },
  { size: "160×200", category: "double", label: "Двоспальний" },
  { size: "170×190", category: "double", label: "Двоспальний" },
  { size: "170×200", category: "double", label: "Двоспальний" },
  // King Size (2 розміри)
  { size: "180×190", category: "king", label: "King Size" },
  { size: "180×200", category: "king", label: "King Size" },
  // King Size XL (1 розмір)
  { size: "200×200", category: "king_xl", label: "King Size XL" },
] as const

export type MattressSize = typeof MATTRESS_SIZES[number]["size"]

/**
 * Категорії продуктів (типи матраців)
 * Синхронізовано з фронтендом (Catalog.jsx filterOptions.types)
 */
export const PRODUCT_TYPE_OPTIONS = {
  springless: { value: "springless", label: "Безпружинні" },
  spring: { value: "spring", label: "Пружинні" },
  children: { value: "children", label: "Дитячі" },
  topper: { value: "topper", label: "Топери" },
  rolled: { value: "rolled", label: "Скручені" },
  accessories: { value: "accessories", label: "Аксесуари" },
} as const

export type ProductType = keyof typeof PRODUCT_TYPE_OPTIONS
