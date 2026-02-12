import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOMER_MODULE } from "../../../modules/customer"
import type CustomerModuleService from "../../../modules/customer/service"
import { extractBearerToken, verifyToken } from "../../../utils/jwt"

/**
 * GET /store/auth/me
 *
 * Повертає дані поточного авторизованого користувача.
 *
 * Headers: Authorization: Bearer <token>
 * Response: { user: {...} }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Витягуємо токен з header
    const token = extractBearerToken(req.headers.authorization)

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Токен авторизації відсутній",
      })
    }

    // Верифікуємо токен
    const payload = verifyToken(token)

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Невалідний або прострочений токен",
      })
    }

    // Отримуємо дані користувача
    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)

    const customer = await customerService.retrieveCustomer(payload.userId)

    if (!customer) {
      return res.status(404).json({
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

    return res.status(200).json({
      success: true,
      user: {
        id: customer.id,
        phone: customer.phone,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        createdAt: customer.created_at,
      },
    })
  } catch (error) {
    console.error("[auth/me] Error:", error)
    return res.status(500).json({
      success: false,
      error: "Внутрішня помилка сервера",
    })
  }
}
