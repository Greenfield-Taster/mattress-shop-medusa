import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules, LinkDefinition } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { MATTRESS_MODULE } from "../../../modules/mattress"
import MattressModuleService from "../../../modules/mattress/service"

/**
 * POST /admin/mattresses
 * 
 * Створює матрац: Product + Variants (розміри) + MattressAttributes + Prices
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const {
    title,
    handle,
    description,
    images,
    height,
    hardness,
    block_type,
    cover_type,
    max_weight,
    fillers,
    description_main,
    description_care,
    specs,
    is_new,
    discount_percent,
    variants,
  } = req.body as any

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const mattressService: MattressModuleService = req.scope.resolve(MATTRESS_MODULE)
  const salesChannelService = req.scope.resolve(Modules.SALES_CHANNEL)

  try {
    // 1. Отримуємо default sales channel
    const salesChannels = await salesChannelService.listSalesChannels({
      name: "Default Sales Channel",
    })
    const salesChannelId = salesChannels[0]?.id

    // 2. Генеруємо handle якщо не вказано
    const productHandle = handle || title
      .toLowerCase()
      .replace(/[^a-zа-яіїєґ0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .substring(0, 100)

    // 3. Використовуємо workflow для створення продукту з цінами
    const { result } = await createProductsWorkflow(req.scope).run({
      input: {
        products: [
          {
            title,
            handle: productHandle,
            description: description || description_main,
            status: "published" as const,
            images: images?.map((url: string) => ({ url })) || [],
            options: [
              {
                title: "Розмір",
                values: variants.map((v: any) => v.size),
              },
            ],
            variants: variants.map((v: any) => ({
              title: v.size,
              sku: `${productHandle}-${v.size}`.toUpperCase().replace(/[×х]/g, "X").replace(/\s+/g, "-"),
              options: { "Розмір": v.size },
              manage_inventory: false,
              prices: [
                {
                  amount: v.price,
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

    // 4. Створюємо MattressAttributes
    const mattressAttributes = await mattressService.createMattressAttributes({
      height,
      hardness,
      block_type,
      cover_type,
      max_weight,
      fillers: fillers || [],
      description_main,
      description_care,
      specs: specs || [],
      is_new: is_new || false,
      discount_percent: discount_percent || 0,
    })

    // 5. Створюємо link між Product та MattressAttributes
    await link.create({
      [Modules.PRODUCT]: { product_id: product.id },
      [MATTRESS_MODULE]: { mattress_attributes_id: mattressAttributes.id },
    })

    // 6. Отримуємо повні дані продукту для відповіді
    const { data: [fullProduct] } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "status",
        "thumbnail",
        "variants.*",
        "variants.price_set.prices.*",
        "mattress_attributes.*",
      ],
      filters: { id: product.id },
    })

    res.status(201).json({
      product: fullProduct,
      message: "Матрац успішно створено",
    })
  } catch (error: any) {
    console.error("Error creating mattress:", error)
    res.status(400).json({
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}

/**
 * GET /admin/mattresses
 * 
 * Отримує список матраців з їх атрибутами
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { limit = "50", offset = "0" } = req.query as Record<string, string>

  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "status",
        "thumbnail",
        "created_at",
        "updated_at",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.price_set.prices.*",
        "images.url",
        "mattress_attributes.*",
      ],
      pagination: {
        take: parseInt(limit),
        skip: parseInt(offset),
      },
    })

    // Фільтруємо тільки продукти з mattress_attributes
    const mattresses = products.filter((p: any) => p.mattress_attributes)

    // Форматуємо ціни для зручності
    const formattedMattresses = mattresses.map((m: any) => ({
      ...m,
      variants: m.variants?.map((v: any) => ({
        ...v,
        prices: v.price_set?.prices || [],
      })),
    }))

    res.json({ 
      mattresses: formattedMattresses,
      count: formattedMattresses.length,
    })
  } catch (error: any) {
    console.error("Error fetching mattresses:", error)
    res.status(400).json({
      message: error.message,
    })
  }
}
