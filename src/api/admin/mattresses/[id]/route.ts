import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { MATTRESS_MODULE } from "../../../../modules/mattress"
import MattressModuleService from "../../../../modules/mattress/service"
import type { Logger } from "@medusajs/framework/types"

/**
 * GET /admin/mattresses/:id
 *
 * Отримує один матрац з усіма атрибутами
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const {
      data: [product],
    } = await query.graph({
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
        "images.*",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.price_set.prices.*",
        "mattress_attributes.*",
      ],
      filters: { id },
    })

    if (!product) {
      return res.status(404).json({ message: "Mattress not found" })
    }

    // Форматуємо відповідь
    const formattedProduct = {
      ...product,
      variants: (product as any).variants?.map((v: any) => ({
        ...v,
        prices: v.price_set?.prices || [],
      })),
    }

    res.json({ mattress: formattedProduct })
  } catch (error: unknown) {
    const logger: Logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    logger.error(`Error fetching mattress ${id}: ${errorMessage}`)
    res.status(400).json({ message: errorMessage })
  }
}

/**
 * PUT /admin/mattresses/:id
 *
 * Оновлює атрибути матраца, зображення та ціни варіантів
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const logger: Logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  logger.debug(`PUT /admin/mattresses/${id}`)

  const {
    title,
    description,
    status,
    images,
    height,
    hardness,
    block_type,
    cover_type,
    max_weight,
    fillers,
    product_type,
    description_main,
    description_care,
    specs,
    is_new,
    discount_percent,
    certificates,
    variants: variantPrices,
  } = req.body as any

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const pricingService = req.scope.resolve(Modules.PRICING) as any
  const mattressService: MattressModuleService =
    req.scope.resolve(MATTRESS_MODULE)

  try {
    // 1. Отримуємо продукт
    const {
      data: [product],
    } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "variants.id",
        "variants.price_set.id",
        "variants.price_set.prices.*",
      ],
      filters: { id },
    })

    if (!product) {
      return res.status(404).json({ message: "Mattress not found" })
    }

    // 2. Отримуємо mattress_attributes через link query
    const { data: mattressLinks } = await query.graph({
      entity: "product_mattress_attributes",
      fields: ["mattress_attributes_id", "product_id"],
      filters: { product_id: id },
    })

    const mattressAttrId = mattressLinks?.[0]?.mattress_attributes_id
    logger.debug(`Mattress attributes ID: ${mattressAttrId}`)

    // 3. Оновлюємо базові дані продукту
    const productUpdateData: any = { id }

    if (title) productUpdateData.title = title
    if (description !== undefined) productUpdateData.description = description
    if (status) productUpdateData.status = status

    if (images && Array.isArray(images) && images.length > 0) {
      productUpdateData.images = images.map((url: string) => ({ url }))
      productUpdateData.thumbnail = images[0]
      logger.debug(`Images to update: ${images.length}`)
    }

    if (Object.keys(productUpdateData).length > 1) {
      logger.debug(`Updating product ${id}`)
      await updateProductsWorkflow(req.scope).run({
        input: { products: [productUpdateData] },
      })
      logger.debug("Product updated successfully")
    }

    // 4. Оновлюємо ціни варіантів
    if (variantPrices && Array.isArray(variantPrices)) {
      for (const vp of variantPrices) {
        if (!vp.id || vp.price === undefined) continue

        const variant = (product as any).variants?.find(
          (v: any) => v.id === vp.id
        )
        if (!variant?.price_set?.id) continue

        const uahPrice = variant.price_set.prices?.find(
          (p: any) => p.currency_code === "uah"
        )

        if (uahPrice?.id) {
          // Оновлюємо існуючу ціну
          await pricingService.updatePrices([
            {
              id: uahPrice.id,
              amount: vp.price,
              currency_code: "uah",
            },
          ])
        } else {
          // Створюємо нову ціну для price set
          await pricingService.createPrices([
            {
              price_set_id: variant.price_set.id,
              amount: vp.price,
              currency_code: "uah",
            },
          ])
        }
      }
    }

    // 5. Оновлюємо MattressAttributes
    if (mattressAttrId) {
      const updateData: any = {}

      if (height !== undefined) updateData.height = height
      if (hardness) updateData.hardness = hardness
      if (block_type) updateData.block_type = block_type
      if (cover_type) updateData.cover_type = cover_type
      if (max_weight !== undefined) updateData.max_weight = max_weight
      if (fillers) updateData.fillers = fillers
      if (product_type !== undefined) updateData.product_type = product_type
      if (description_main !== undefined)
        updateData.description_main = description_main
      if (description_care !== undefined)
        updateData.description_care = description_care
      if (specs) updateData.specs = specs
      if (is_new !== undefined) updateData.is_new = is_new
      if (discount_percent !== undefined)
        updateData.discount_percent = discount_percent
      if (certificates !== undefined) updateData.certificates = certificates

      if (Object.keys(updateData).length > 0) {
        logger.debug(`Updating mattress attributes ${mattressAttrId}`)
        await mattressService.updateMattressAttr({
          id: mattressAttrId,
          ...updateData,
        })
        logger.debug("Mattress attributes updated")
      }
    }

    // 6. Отримуємо оновлений продукт
    const {
      data: [updatedProduct],
    } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "status",
        "thumbnail",
        "images.*",
        "variants.id",
        "variants.title",
        "variants.price_set.prices.*",
        "mattress_attributes.*",
      ],
      filters: { id },
    })

    const formattedProduct = {
      ...updatedProduct,
      variants: (updatedProduct as any).variants?.map((v: any) => ({
        ...v,
        prices: v.price_set?.prices || [],
      })),
    }

    res.json({
      mattress: formattedProduct,
      message: "Матрац успішно оновлено",
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    logger.error(`Error updating mattress ${id}: ${errorMessage}`)
    res.status(400).json({ message: errorMessage })
  }
}

/**
 * DELETE /admin/mattresses/:id
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const logger: Logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const productService = req.scope.resolve(Modules.PRODUCT) as any
  const mattressService: MattressModuleService =
    req.scope.resolve(MATTRESS_MODULE)

  try {
    const { data: mattressLinks } = await query.graph({
      entity: "product_mattress_attributes",
      fields: ["mattress_attributes_id", "product_id"],
      filters: { product_id: id },
    })

    const mattressAttrId = mattressLinks?.[0]?.mattress_attributes_id

    if (mattressAttrId) {
      await link.dismiss({
        [Modules.PRODUCT]: { product_id: id },
        [MATTRESS_MODULE]: { mattress_attributes_id: mattressAttrId },
      })

      await mattressService.deleteMattressAttr(mattressAttrId)
    }

    await productService.deleteProducts([id])

    logger.info(`Mattress deleted: ${id}`)

    res.json({
      success: true,
      message: "Матрац успішно видалено",
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    logger.error(`Error deleting mattress ${id}: ${errorMessage}`)
    res.status(400).json({ message: errorMessage })
  }
}
