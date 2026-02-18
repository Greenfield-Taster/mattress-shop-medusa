import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOMER_MODULE } from "../../../modules/customer"
import type CustomerModuleService from "../../../modules/customer/service"
import { extractBearerToken, verifyToken, generateToken } from "../../../utils/jwt"

/**
 * POST /auth/refresh
 *
 * Оновлює JWT токен. Потрібен валідний (не прострочений) токен.
 * Перевіряє що користувач існує та активний.
 *
 * Headers: Authorization: Bearer <token>
 * Response: { token: "...", expiresIn: 259200 }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const token = extractBearerToken(req.headers.authorization)

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Токен авторизації відсутній",
      })
    }

    const payload = verifyToken(token)

    if (!payload?.userId) {
      return res.status(401).json({
        success: false,
        error: "Невалідний або прострочений токен",
      })
    }

    // Перевіряємо що користувач існує та активний
    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)
    const customer = await customerService.retrieveCustomer(payload.userId)

    if (!customer) {
      return res.status(401).json({
        success: false,
        error: "Користувача не знайдено",
      })
    }

    if (!customer.is_active) {
      return res.status(403).json({
        success: false,
        error: "Акаунт деактивовано",
      })
    }

    // Генеруємо новий токен (3 дні)
    const newToken = generateToken(customer.id)

    return res.status(200).json({
      success: true,
      token: newToken,
    })
  } catch (error) {
    console.error("[auth/refresh] Error:", error)
    return res.status(500).json({
      success: false,
      error: "Внутрішня помилка сервера",
    })
  }
}
