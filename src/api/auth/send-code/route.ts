import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOMER_MODULE } from "../../../modules/customer"
import type CustomerModuleService from "../../../modules/customer/service"
import {
  generateVerificationCode,
  sendVerificationSms,
  validatePhoneNumber,
  normalizePhoneNumber,
} from "../../../services/sms"

interface SendCodeRequestBody {
  phone: string
}

/**
 * POST /auth/send-code
 *
 * Відправляє SMS код верифікації на вказаний номер телефону.
 *
 * Body: { phone: "+380..." }
 * Response: { success: true, expiresIn: 300 }
 */
export async function POST(
  req: MedusaRequest<SendCodeRequestBody>,
  res: MedusaResponse
) {
  try {
    const { phone } = req.body

    // Валідація
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Номер телефону обов'язковий",
      })
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        error: "Невірний формат номера телефону",
      })
    }

    // Нормалізуємо номер
    const normalizedPhone = normalizePhoneNumber(phone)

    // Отримуємо сервіс
    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)

    // Знаходимо або створюємо користувача
    const customer = await customerService.findOrCreateByPhone(normalizedPhone)

    // Генеруємо код верифікації
    const code = generateVerificationCode()

    // Зберігаємо код з TTL 10 хвилин (TODO: змінити на 5 для продакшену)
    await customerService.saveVerificationCode(customer.id, code, 10)

    // Відправляємо SMS
    const sent = await sendVerificationSms(normalizedPhone, code)

    if (!sent) {
      return res.status(500).json({
        success: false,
        error: "Не вдалося відправити SMS",
      })
    }

    return res.status(200).json({
      success: true,
      expiresIn: 600, // 10 хвилин в секундах
    })
  } catch (error) {
    console.error("[auth/send-code] Error:", error)
    return res.status(500).json({
      success: false,
      error: "Внутрішня помилка сервера",
    })
  }
}
