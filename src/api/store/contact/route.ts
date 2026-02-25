import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"

export const AUTHENTICATE = false

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { name, phone, email, message } = req.body as {
      name: string
      phone: string
      email: string
      message: string
    }

    const storeEmail = process.env.STORE_EMAIL || "info@just-sleep.com.ua"

    const notificationService = req.scope.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    await notificationService.createNotifications([{
      to: storeEmail,
      channel: "email",
      template: "contact-form",
      data: { name, phone, email, message },
    }])

    return res.status(200).json({
      success: true,
      message: "Повідомлення надіслано",
    })
  } catch (error: any) {
    console.error("[contact] Error sending message:", error.message)
    return res.status(500).json({
      success: false,
      error: "Помилка відправки повідомлення",
    })
  }
}
