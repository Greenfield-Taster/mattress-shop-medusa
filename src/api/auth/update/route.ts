import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOMER_MODULE } from "../../../modules/customer"
import type CustomerModuleService from "../../../modules/customer/service"
import { extractBearerToken, verifyToken } from "../../../utils/jwt"

interface UpdateProfileRequestBody {
  firstName?: string
  lastName?: string
  email?: string
  avatar?: string
}

/**
 * PUT /store/auth/update
 *
 * Оновлює профіль поточного авторизованого користувача.
 *
 * Headers: Authorization: Bearer <token>
 * Body: { firstName?: "...", lastName?: "...", email?: "..." }
 * Response: { user: {...} }
 */
export async function PUT(
  req: MedusaRequest<UpdateProfileRequestBody>,
  res: MedusaResponse
) {
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

    const { firstName, lastName, email, avatar } = req.body

    // Валідація email якщо передано
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Невірний формат email",
      })
    }

    // Отримуємо сервіс
    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)

    // Перевіряємо чи існує користувач
    const existingCustomer = await customerService.retrieveCustomer(payload.userId)

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        error: "Користувача не знайдено",
      })
    }

    // Перевіряємо унікальність email якщо він змінюється
    if (email && email !== existingCustomer.email) {
      const emailExists = await customerService.findByEmail(email)
      if (emailExists && emailExists.id !== payload.userId) {
        return res.status(400).json({
          success: false,
          error: "Цей email вже використовується іншим користувачем",
        })
      }
    }

    // Оновлюємо профіль
    const updatedCustomer = await customerService.updateCustomerData({
      id: payload.userId,
      first_name: firstName ?? existingCustomer.first_name,
      last_name: lastName ?? existingCustomer.last_name,
      email: email ?? existingCustomer.email,
      avatar: avatar ?? existingCustomer.avatar,
    })

    return res.status(200).json({
      success: true,
      user: {
        id: updatedCustomer.id,
        phone: updatedCustomer.phone,
        email: updatedCustomer.email,
        firstName: updatedCustomer.first_name,
        lastName: updatedCustomer.last_name,
        avatar: updatedCustomer.avatar,
      },
    })
  } catch (error) {
    console.error("[auth/update] Error:", error)
    return res.status(500).json({
      success: false,
      error: "Внутрішня помилка сервера",
    })
  }
}

/**
 * Валідація email адреси
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
