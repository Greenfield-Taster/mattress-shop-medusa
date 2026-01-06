import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { MATTRESS_MODULE } from "../modules/mattress"
import MattressModuleService from "../modules/mattress/service"

/**
 * Seed скрипт для створення тестових матраців
 * 
 * Запуск: npx medusa exec ./src/scripts/seed-mattresses.ts
 */
export default async function seedMattresses({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL) as any
  const mattressService: MattressModuleService = container.resolve(MATTRESS_MODULE)

  logger.info("Starting mattress seed...")

  // Отримуємо sales channel
  const salesChannels = await salesChannelService.listSalesChannels({
    name: "Default Sales Channel",
  })
  const salesChannelId = salesChannels[0]?.id

  // Тестові матраци
  const mattressesData = [
    {
      title: "Orthopedic AirFlow Pro",
      handle: "orthopedic-airflow-pro",
      height: 22,
      hardness: "H3" as const,
      block_type: "independent_spring" as const,
      cover_type: "removable" as const,
      max_weight: 120,
      fillers: ["latex", "memory_foam"],
      description_main: "Матрац оптимальної жорсткості з ортопедичним ефектом. Основу моделі складає незалежний пружинний блок «Pocket Spring», який забезпечує індивідуальну підтримку кожної точки тіла.",
      description_care: "Рекомендується провітрювати матрац кожні 2-3 місяці. Не використовуйте засоби з хлором.",
      specs: [
        "Допустиме навантаження - 120 кг",
        "Рівень жорсткості - H3 (середня)",
        "Висота - 22 см",
        "Незалежний пружинний блок",
      ],
      is_new: false,
      discount_percent: 20,
      basePrice: 7990,
    },
    {
      title: "Comfort Dream Latex",
      handle: "comfort-dream-latex",
      height: 18,
      hardness: "H2" as const,
      block_type: "springless" as const,
      cover_type: "non_removable" as const,
      max_weight: 140,
      fillers: ["latex_foam", "coconut"],
      description_main: "Безпружинний матрац середньої жорсткості з латексованою піною та кокосовим волокном.",
      description_care: "Для догляду використовуйте м'яку щітку або пилосос.",
      specs: [
        "Допустиме навантаження - 140 кг",
        "Рівень жорсткості - H2",
        "Висота - 18 см",
        "Безпружинна конструкція",
      ],
      is_new: true,
      discount_percent: 0,
      basePrice: 12500,
    },
    {
      title: "Kids Paradise Soft",
      handle: "kids-paradise-soft",
      height: 12,
      hardness: "H1" as const,
      block_type: "springless" as const,
      cover_type: "removable" as const,
      max_weight: 60,
      fillers: ["coconut"],
      description_main: "Дитячий ортопедичний матрац м'якої жорсткості для здорового розвитку хребта дитини.",
      description_care: "Чохол можна прати при температурі до 40°C.",
      specs: [
        "Допустиме навантаження - 60 кг",
        "Рівень жорсткості - H1 (м'який)",
        "Висота - 12 см",
        "Гіпоалергенні матеріали",
      ],
      is_new: false,
      discount_percent: 15,
      basePrice: 5490,
    },
  ]

  // Всі доступні розміри з модифікаторами цін (29 стандартних розмірів, синхронізовано з MattressQuiz)
  const sizesWithPrices = [
    // Дитячі (8 розмірів)
    { size: "60×120", priceModifier: -3000 },
    { size: "70×140", priceModifier: -2800 },
    { size: "70×150", priceModifier: -2600 },
    { size: "70×160", priceModifier: -2400 },
    { size: "70×170", priceModifier: -2200 },
    { size: "70×180", priceModifier: -2000 },
    { size: "70×190", priceModifier: -1800 },
    { size: "70×200", priceModifier: -1600 },
    // Односпальні (8 розмірів)
    { size: "80×150", priceModifier: -1400 },
    { size: "80×160", priceModifier: -1300 },
    { size: "80×170", priceModifier: -1200 },
    { size: "80×180", priceModifier: -1100 },
    { size: "80×190", priceModifier: -1000 },
    { size: "80×200", priceModifier: -800 },
    { size: "90×190", priceModifier: -500 },
    { size: "90×200", priceModifier: -300 },
    // Полуторні (2 розміри)
    { size: "120×190", priceModifier: 0 },
    { size: "120×200", priceModifier: 200 },
    // Двоспальні (8 розмірів)
    { size: "140×190", priceModifier: 500 },
    { size: "140×200", priceModifier: 700 },
    { size: "150×190", priceModifier: 900 },
    { size: "150×200", priceModifier: 1100 },
    { size: "160×190", priceModifier: 1300 },
    { size: "160×200", priceModifier: 1500 },
    { size: "170×190", priceModifier: 1700 },
    { size: "170×200", priceModifier: 1900 },
    // King Size (2 розміри)
    { size: "180×190", priceModifier: 2100 },
    { size: "180×200", priceModifier: 2300 },
    // King Size XL (1 розмір)
    { size: "200×200", priceModifier: 2500 },
  ]

  const sizes = sizesWithPrices.map(s => s.size)

  for (const data of mattressesData) {
    logger.info(`Creating mattress: ${data.title}`)

    try {
      // 1. Створюємо Product через workflow (з цінами)
      const { result } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: data.title,
              handle: data.handle,
              description: data.description_main,
              status: "published" as const,
              options: [
                {
                  title: "Розмір",
                  values: sizes,
                },
              ],
              variants: sizesWithPrices.map(({ size, priceModifier }) => ({
                title: size,
                sku: `${data.handle}-${size}`.toUpperCase().replace(/[×х]/g, "X"),
                options: { "Розмір": size },
                manage_inventory: false,
                prices: [
                  {
                    amount: Math.max(1000, data.basePrice + priceModifier), // Мінімальна ціна 1000
                    currency_code: "uah",
                  },
                ],
              })),
              sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
            },
          ],
        },
      })

      const product = result[0]

      // 2. Створюємо MattressAttributes
      const mattressAttributes = await (mattressService as any).createMattressAttributes({
        height: data.height,
        hardness: data.hardness,
        block_type: data.block_type,
        cover_type: data.cover_type,
        max_weight: data.max_weight,
        fillers: data.fillers,
        description_main: data.description_main,
        description_care: data.description_care,
        specs: data.specs,
        is_new: data.is_new,
        discount_percent: data.discount_percent,
      })

      // 3. Link Product ↔ MattressAttributes
      await link.create({
        [Modules.PRODUCT]: { product_id: product.id },
        [MATTRESS_MODULE]: { mattress_attributes_id: mattressAttributes.id },
      })

      logger.info(`✓ Created: ${data.title}`)
    } catch (error: any) {
      logger.error(`✗ Failed to create ${data.title}: ${error.message}`)
    }
  }

  logger.info("Finished seeding mattresses!")
}
