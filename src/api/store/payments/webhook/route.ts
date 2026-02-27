import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  verifyWebhookSignature,
  buildWebhookResponse,
  type WebhookBody,
} from "../../../../utils/wayforpay"

export const AUTHENTICATE = false

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as WebhookBody

    if (!body || !body.orderReference || !body.merchantSignature) {
      console.error("[wayforpay] Invalid webhook body")
      return res.status(400).json({ error: "Invalid request" })
    }

    // Verify signature
    if (!verifyWebhookSignature(body)) {
      console.error("[wayforpay] Invalid signature for order:", body.orderReference)
      return res.status(400).json({ error: "Invalid signature" })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Find order by order_number (orderReference)
    const { data: orders } = await query.graph({
      entity: "shop_order",
      filters: { order_number: body.orderReference },
      fields: [
        "id",
        "order_number",
        "payment_status",
        "payment_method",
        "transaction_id",
        "full_name",
        "email",
        "total",
        "subtotal",
        "discount_amount",
        "delivery_price",
        "delivery_price_type",
        "delivery_method",
        "delivery_city",
        "delivery_warehouse",
        "delivery_address",
        "promo_code",
        "items.*",
      ],
    })

    const orderData = (orders as Record<string, any>[])?.[0]

    if (!orderData) {
      console.error("[wayforpay] Order not found:", body.orderReference)
      // Still return 200 with accept to stop retries
      return res.json(buildWebhookResponse(body.orderReference))
    }

    // Idempotency: skip if already processed
    if (orderData.transaction_id && orderData.payment_status === "paid") {
      console.log("[wayforpay] Order already paid:", body.orderReference)
      return res.json(buildWebhookResponse(body.orderReference))
    }

    // Update order based on transaction status
    const orderService = req.scope.resolve("shopOrderService") as any

    if (body.transactionStatus === "Approved") {
      await orderService.updateOrders({
        id: orderData.id,
        payment_status: "paid",
        transaction_id: body.orderReference,
      })

      // Send confirmation email
      try {
        const notificationService = req.scope.resolve(Modules.NOTIFICATION) as any

        const items = (orderData.items || []).map((item: any) => ({
          title: item.product_title || item.title || "Товар",
          size: item.variant_title || item.size || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.unit_price * item.quantity,
        }))

        await notificationService.createNotifications({
          to: orderData.email,
          channel: "email",
          template: "payment-confirmed",
          data: {
            order_number: orderData.order_number,
            full_name: orderData.full_name,
            email: orderData.email,
            items,
            subtotal: orderData.subtotal,
            discount_amount: orderData.discount_amount || 0,
            delivery_price: orderData.delivery_price || 0,
            delivery_price_type: orderData.delivery_price_type || "free",
            total: orderData.total,
            delivery_method: orderData.delivery_method,
            delivery_city: orderData.delivery_city,
            delivery_warehouse: orderData.delivery_warehouse,
            delivery_address: orderData.delivery_address,
            payment_method: orderData.payment_method,
            promo_code: orderData.promo_code,
          },
        })
      } catch (emailError) {
        console.error("[wayforpay] Error sending confirmation email:", emailError)
      }

      console.log("[wayforpay] Payment approved for order:", body.orderReference)
    } else if (
      body.transactionStatus === "Declined" ||
      body.transactionStatus === "Expired"
    ) {
      await orderService.updateOrders({
        id: orderData.id,
        payment_status: "failed",
        transaction_id: body.orderReference,
      })
      console.log(
        "[wayforpay] Payment",
        body.transactionStatus,
        "for order:",
        body.orderReference,
        "reason:",
        body.reason
      )
    }

    // Return signed acknowledgement
    return res.json(buildWebhookResponse(body.orderReference))
  } catch (error: any) {
    console.error("[wayforpay] Webhook error:", error)
    return res.status(500).json({ error: "Internal error" })
  }
}
