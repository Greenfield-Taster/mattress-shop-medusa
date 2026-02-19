import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOMER_MODULE } from "../../../modules/customer"
import type CustomerModuleService from "../../../modules/customer/service"
import { generateToken } from "../../../utils/jwt"
import { normalizePhoneNumber, validatePhoneNumber } from "../../../services/sms"

interface VerifyCodeRequestBody {
  phone: string
  code: string
}

/**
 * POST /auth/verify-code
 *
 * Верифікує SMS код і повертає JWT токен.
 *
 * Body: { phone: "+380...", code: "xxxxxx" }
 * Response: { token: "jwt...", user: {...} }
 */
export async function POST(
  req: MedusaRequest<VerifyCodeRequestBody>,
  res: MedusaResponse
) {
  try {
    const { phone, code } = req.body

    // Валідація
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: "Номер телефону та код обов'язкові",
      })
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        error: "Невірний формат номера телефону",
      })
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        error: "Код має містити 6 цифр",
      })
    }

    // Нормалізуємо номер
    const normalizedPhone = normalizePhoneNumber(phone)

    // Отримуємо сервіс
    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)

    // Знаходимо користувача
    const customer = await customerService.findByPhone(normalizedPhone)

    if (!customer) {
      return res.status(401).json({
        success: false,
        error: "Користувача не знайдено. Спочатку отримайте код верифікації.",
      })
    }

    // Перевіряємо код
    const isValid = await customerService.verifyCode(customer.id, code)

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "Невірний або прострочений код верифікації",
      })
    }

    // Очищуємо код верифікації та оновлюємо last_login_at
    await customerService.clearVerificationCode(customer.id)

    // Генеруємо JWT токен
    const token = generateToken(customer.id)

    // Формуємо відповідь
    return res.status(200).json({
      success: true,
      token,
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
    console.error("[auth/verify-code] Error:", error)
    return res.status(500).json({
      success: false,
      error: "Внутрішня помилка сервера",
    })
  }
}
