import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { buildPaymentData } from "../../../../../utils/wayforpay"

export const AUTHENTICATE = false

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: orders } = await query.graph({
      entity: "shop_order",
      filters: { id },
      fields: [
        "id",
        "order_number",
        "payment_status",
        "payment_method",
        "full_name",
        "email",
        "phone",
        "total",
        "items.*",
      ],
    })

    const order = (orders as Record<string, any>[])?.[0]

    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }

    if (order.payment_method !== "card-online") {
      return res.status(400).json({ error: "Order payment method is not card-online" })
    }

    if (order.payment_status === "paid") {
      return res.status(400).json({ error: "Order is already paid" })
    }

    const nameParts = (order.full_name || "").split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    const items = order.items || []
    const productNames = items.map(
      (item: any) => item.product_title || item.title || "Товар"
    )
    const productCounts = items.map((item: any) => item.quantity)
    const productPrices = items.map(
      (item: any) => Math.round((item.unit_price * item.quantity) / 100)
    )

    // Total in UAH (not kopecks)
    const amountUAH = Math.round(order.total / 100)

    const serviceUrl = process.env.WAYFORPAY_SERVICE_URL || undefined

    const paymentData = buildPaymentData({
      orderReference: order.order_number,
      orderDate: Math.floor(Date.now() / 1000),
      amount: amountUAH,
      currency: "UAH",
      productNames,
      productCounts,
      productPrices,
      clientFirstName: firstName,
      clientLastName: lastName,
      clientEmail: order.email || "",
      clientPhone: (order.phone || "").replace(/^0/, "380"),
      serviceUrl,
    })

    return res.json({ paymentData })
  } catch (error: any) {
    console.error("[payments] Error initiating payment:", error)
    return res.status(500).json({ error: "Failed to initiate payment" })
  }
}
