import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
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
  const productService = req.scope.resolve(Modules.PRODUCT)
  const pricingService = req.scope.resolve(Modules.PRICING)
  const salesChannelService = req.scope.resolve(Modules.SALES_CHANNEL)

  try {
    // 1. Отримуємо shipping profile
    const { data: shippingProfiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
      filters: { type: "default" },
    })
    
    const shippingProfileId = shippingProfiles[0]?.id
    if (!shippingProfileId) {
      throw new Error("Default shipping profile not found. Run: npm run seed")
    }

    // 2. Отримуємо default sales channel
    const salesChannels = await salesChannelService.listSalesChannels({
      name: "Default Sales Channel",
    })
    const salesChannelId = salesChannels[0]?.id

    // 3. Генеруємо handle якщо не вказано
    const productHandle = handle || title
      .toLowerCase()
      .replace(/[^a-zа-яіїєґ0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .substring(0, 100)

    // 4. Створюємо Product з варіантами
    const product = await productService.createProducts({
      title,
      handle: productHandle,
      description: description || description_main,
      status: "published",
      shipping_profile_id: shippingProfileId,
      images: images?.map((url: string) => ({ url })) || [],
      options: [
        {
          title: "Розмір",
          values: variants.map((v: any) => v.size),
        },
      ],
      variants: variants.map((v: any, index: number) => ({
        title: v.size,
        sku: `${productHandle}-${v.size}`.toUpperCase().replace(/[×х]/g, "X").replace(/\s+/g, "-"),
        options: { "Розмір": v.size },
        manage_inventory: false,
      })),
    })

    // 5. Створюємо Price Sets для кожного варіанту
    for (const variant of product.variants || []) {
      const variantData = variants.find((v: any) => v.size === variant.title)
      if (!variantData) continue

      // Створюємо price set
      const priceSet = await pricingService.createPriceSets({
        prices: [
          {
            amount: variantData.price,
            currency_code: "uah",
          },
        ],
      })

      // Прив'язуємо price set до варіанту
      await link.create({
        [Modules.PRODUCT]: { product_variant_id: variant.id },
        [Modules.PRICING]: { price_set_id: priceSet.id },
      })
    }

    // 6. Прив'язуємо до sales channel
    if (salesChannelId) {
      await link.create({
        [Modules.PRODUCT]: { product_id: product.id },
        [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannelId },
      })
    }

    // 7. Створюємо MattressAttributes
    const mattressAttributes = await mattressService.createMattressAttributess({
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

    // 8. Створюємо link між Product та MattressAttributes
    await link.create({
      [Modules.PRODUCT]: { product_id: product.id },
      [MATTRESS_MODULE]: { mattress_attributes_id: mattressAttributes.id },
    })

    // 9. Отримуємо повні дані продукту для відповіді
    const { data: [fullProduct] } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "status",
        "variants.*",
        "variants.prices.*",
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
        "variants.prices.*",
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

    res.json({ 
      mattresses,
      count: mattresses.length,
    })
  } catch (error: any) {
    console.error("Error fetching mattresses:", error)
    res.status(400).json({
      message: error.message,
    })
  }
}
