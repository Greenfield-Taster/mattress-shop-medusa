import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { OAuth2Client } from "google-auth-library"
import { CUSTOMER_MODULE } from "../../../modules/customer"
import type CustomerModuleService from "../../../modules/customer/service"
import { generateToken } from "../../../utils/jwt"

interface GoogleAuthRequestBody {
  credential: string
}

/**
 * POST /store/auth/google
 *
 * Авторизація через Google OAuth.
 * Верифікує Google ID token і створює/оновлює користувача.
 *
 * Body: { credential: "google_id_token" }
 * Response: { token: "jwt...", user: {...} }
 */
export async function POST(
  req: MedusaRequest<GoogleAuthRequestBody>,
  res: MedusaResponse
) {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: "Google credential обов'язковий",
      })
    }

    // Отримуємо Google Client ID з env
    const clientId = process.env.GOOGLE_CLIENT_ID

    if (!clientId) {
      console.error("[auth/google] GOOGLE_CLIENT_ID not configured")
      return res.status(500).json({
        success: false,
        error: "Google OAuth не налаштований",
      })
    }

    // Верифікуємо Google ID token
    const client = new OAuth2Client(clientId)

    let ticket
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      })
    } catch (verifyError) {
      console.error("[auth/google] Token verification failed:", verifyError)
      return res.status(401).json({
        success: false,
        error: "Невалідний Google token",
      })
    }

    const payload = ticket.getPayload()

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Не вдалося отримати дані з Google token",
      })
    }

    // Витягуємо дані користувача з Google
    const { sub: googleId, email, given_name, family_name, picture } = payload
    console.log("[auth/google] Google payload:", { googleId, email, given_name, family_name, picture })

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email обов'язковий для Google авторизації",
      })
    }

    // Отримуємо сервіс
    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)

    // Знаходимо або створюємо користувача
    const customer = await customerService.findOrCreateByGoogle({
      googleId,
      email,
      firstName: given_name,
      lastName: family_name,
      avatar: picture,
    })

    // Генеруємо JWT токен
    const token = generateToken(customer.id)

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: customer.id,
        phone: customer.phone,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        avatar: customer.avatar,
      },
    })
  } catch (error) {
    console.error("[auth/google] Error:", error)
    return res.status(500).json({
      success: false,
      error: "Внутрішня помилка сервера",
    })
  }
}
