import { model } from "@medusajs/framework/utils"

/**
 * MattressAttributes - кастомні поля для матраців
 * 
 * Зв'язується з Product через Module Link (один до одного)
 */
export const MattressAttributes = model.define("mattress_attributes", {
  id: model.id().primaryKey(),

  // ===== ОСНОВНІ ХАРАКТЕРИСТИКИ =====
  
  /** Висота матраца в см (3-30) */
  height: model.number(),
  
  /** Жорсткість: H1 (м'який), H2, H3, H4 (жорсткий), H5 (дуже жорсткий) */
  hardness: model.enum(["H1", "H2", "H3", "H4", "H5"]),
  
  /** Тип блоку */
  block_type: model.enum([
    "independent_spring",  // Незалежний пружинний блок
    "bonnel_spring",       // Залежний пружинний блок (Bonnel)
    "springless"           // Безпружинний
  ]),
  
  /** Тип чохла */
  cover_type: model.enum([
    "removable",           // Знімний
    "non_removable"        // Незнімний
  ]),
  
  /** Максимальне навантаження на спальне місце (кг) */
  max_weight: model.number(),

  // ===== НАПОВНЮВАЧІ (масив) =====
  
  /** 
   * Наповнювачі матраца
   * Приклад: ["latex", "memory_foam", "coconut"]
   */
  fillers: model.json(),

  // ===== ОПИС =====
  
  /** Основний опис матраца */
  description_main: model.text().nullable(),
  
  /** Рекомендації по догляду */
  description_care: model.text().nullable(),
  
  /** 
   * Технічні характеристики (масив рядків)
   * Приклад: ["Вага 1м² - 14.5 кг", "Двостороння конструкція"]
   */
  specs: model.json().nullable(),

  // ===== СЕРТИФІКАТИ =====

  /**
   * Сертифікати якості (масив об'єктів)
   * Приклад: [{ title: "ISO 9001", image: "https://...", description: "..." }]
   */
  certificates: model.json().nullable(),

  // ===== ПРАПОРЦІ =====
  
  /** Новинка */
  is_new: model.boolean().default(false),
  
  /** Відсоток знижки (0-100) */
  discount_percent: model.number().default(0),

  /** Тип товару (пружинні, безпружинні, дитячі, тощо) */
  product_type: model.text().nullable(),
})

export default MattressAttributes
