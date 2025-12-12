import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { MATTRESS_MODULE } from "../../../../modules/mattress"
import MattressModuleService from "../../../../modules/mattress/service"

/**
 * GET /admin/mattresses/:id
 * 
 * Отримує один матрац з усіма атрибутами
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data: [product] } = await query.graph({
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
      variants: product.variants?.map((v: any) => ({
        ...v,
        prices: v.price_set?.prices || [],
      })),
    }

    res.json({ mattress: formattedProduct })
  } catch (error: any) {
    console.error("Error fetching mattress:", error)
    res.status(400).json({ message: error.message })
  }
}

/**
 * PUT /admin/mattresses/:id
 * 
 * Оновлює атрибути матраца та ціни варіантів
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const {
    title,
    description,
    status,
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
    variants: variantPrices,
  } = req.body as any

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const pricingService = req.scope.resolve(Modules.PRICING)
  const mattressService: MattressModuleService = req.scope.resolve(MATTRESS_MODULE)

  try {
    // 1. Отримуємо продукт
    const { data: [product] } = await query.graph({
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

    console.log("Found mattress attributes link:", mattressLinks)
    console.log("Mattress attributes ID:", mattressAttrId)

    // 3. Оновлюємо базові дані продукту
    if (title || description || status) {
      await updateProductsWorkflow(req.scope).run({
        input: {
          products: [{
            id,
            ...(title && { title }),
            ...(description && { description }),
            ...(status && { status }),
          }],
        },
      })
    }

    // 4. Оновлюємо ціни варіантів
    if (variantPrices && Array.isArray(variantPrices)) {
      for (const vp of variantPrices) {
        if (!vp.id || vp.price === undefined) continue
        
        const variant = product.variants?.find((v: any) => v.id === vp.id)
        if (!variant?.price_set?.id) continue

        const uahPrice = variant.price_set.prices?.find((p: any) => p.currency_code === "uah")
        
        if (uahPrice?.id) {
          await pricingService.updatePrices([{
            id: uahPrice.id,
            amount: vp.price,
          }])
        } else {
          await pricingService.addPrices({
            priceSetId: variant.price_set.id,
            prices: [{
              amount: vp.price,
              currency_code: "uah",
            }],
          })
        }
      }
    }

    // 5. Оновлюємо MattressAttributes якщо є
    if (mattressAttrId) {
      const updateData: any = {}
      
      if (height !== undefined) updateData.height = height
      if (hardness) updateData.hardness = hardness
      if (block_type) updateData.block_type = block_type
      if (cover_type) updateData.cover_type = cover_type
      if (max_weight !== undefined) updateData.max_weight = max_weight
      if (fillers) updateData.fillers = fillers
      if (description_main !== undefined) updateData.description_main = description_main
      if (description_care !== undefined) updateData.description_care = description_care
      if (specs) updateData.specs = specs
      if (is_new !== undefined) updateData.is_new = is_new
      if (discount_percent !== undefined) updateData.discount_percent = discount_percent

      if (Object.keys(updateData).length > 0) {
        console.log("Updating mattress attributes with ID:", mattressAttrId)
        console.log("Update data:", updateData)
        
        // MedusaService update method: pass object with id + data
        const updated = await mattressService.updateMattressAttributes({
          id: mattressAttrId,
          ...updateData
        })
        
        console.log("Update result:", updated)
      }
    } else {
      console.log("No mattress attributes found for product:", id)
    }

    // 6. Отримуємо оновлений продукт
    const { data: [updatedProduct] } = await query.graph({
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
      variants: updatedProduct.variants?.map((v: any) => ({
        ...v,
        prices: v.price_set?.prices || [],
      })),
    }

    res.json({ 
      mattress: formattedProduct,
      message: "Матрац успішно оновлено",
    })
  } catch (error: any) {
    console.error("Error updating mattress:", error)
    res.status(400).json({ message: error.message })
  }
}

/**
 * DELETE /admin/mattresses/:id
 * 
 * Видаляє матрац (продукт + атрибути)
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const productService = req.scope.resolve(Modules.PRODUCT)
  const mattressService: MattressModuleService = req.scope.resolve(MATTRESS_MODULE)

  try {
    // 1. Отримуємо mattress_attributes через link
    const { data: mattressLinks } = await query.graph({
      entity: "product_mattress_attributes",
      fields: ["mattress_attributes_id", "product_id"],
      filters: { product_id: id },
    })

    const mattressAttrId = mattressLinks?.[0]?.mattress_attributes_id

    // 2. Видаляємо link та атрибути
    if (mattressAttrId) {
      await link.dismiss({
        [Modules.PRODUCT]: { product_id: id },
        [MATTRESS_MODULE]: { mattress_attributes_id: mattressAttrId },
      })

      await mattressService.deleteMattressAttributes({ id: mattressAttrId })
    }

    // 3. Видаляємо Product
    await productService.deleteProducts(id)

    res.json({ 
      success: true,
      message: "Матрац успішно видалено",
    })
  } catch (error: any) {
    console.error("Error deleting mattress:", error)
    res.status(400).json({ message: error.message })
  }
}
