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
 */
export const BLOCK_TYPE_OPTIONS = {
  independent_spring: { 
    value: "independent_spring", 
    label: "Незалежний пружинний блок" 
  },
  bonnel_spring: { 
    value: "bonnel_spring", 
    label: "Залежний пружинний блок (Bonnel)" 
  },
  springless: { 
    value: "springless", 
    label: "Безпружинний" 
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
 */
export const FILLER_OPTIONS = {
  latex: { value: "latex", label: "Латекс" },
  memory_foam: { value: "memory_foam", label: "Піна з пам'яттю" },
  coconut: { value: "coconut", label: "Кокосове волокно" },
  latex_foam: { value: "latex_foam", label: "Латексована піна" },
  felt: { value: "felt", label: "Войлок" },
  polyurethane: { value: "polyurethane", label: "Пінополіуретан" },
  horsehair: { value: "horsehair", label: "Кінський волос" },
  cotton: { value: "cotton", label: "Бавовна" },
} as const

export type FillerType = keyof typeof FILLER_OPTIONS

/**
 * Стандартні розміри матраців
 * priceModifier - модифікатор ціни відносно базової
 */
export const MATTRESS_SIZES = [
  { size: "60×120", category: "child", label: "Дитячий" },
  { size: "70×140", category: "child", label: "Дитячий" },
  { size: "70×160", category: "child", label: "Дитячий" },
  { size: "80×190", category: "single", label: "Односпальний" },
  { size: "80×200", category: "single", label: "Односпальний" },
  { size: "90×190", category: "single", label: "Односпальний" },
  { size: "90×200", category: "single", label: "Односпальний" },
  { size: "120×190", category: "semi_double", label: "Полуторний" },
  { size: "120×200", category: "semi_double", label: "Полуторний" },
  { size: "140×190", category: "double", label: "Двоспальний" },
  { size: "140×200", category: "double", label: "Двоспальний" },
  { size: "160×190", category: "double", label: "Двоспальний" },
  { size: "160×200", category: "double", label: "Двоспальний" },
  { size: "180×190", category: "king", label: "King Size" },
  { size: "180×200", category: "king", label: "King Size" },
  { size: "200×200", category: "king_xl", label: "King Size XL" },
] as const

export type MattressSize = typeof MATTRESS_SIZES[number]["size"]

/**
 * Категорії продуктів (типи матраців)
 */
export const PRODUCT_TYPE_OPTIONS = {
  spring: { value: "spring", label: "Пружинні" },
  springless: { value: "springless", label: "Безпружинні" },
  children: { value: "children", label: "Дитячі" },
  topper: { value: "topper", label: "Топери" },
  rolled: { value: "rolled", label: "Скручені" },
} as const

export type ProductType = keyof typeof PRODUCT_TYPE_OPTIONS
