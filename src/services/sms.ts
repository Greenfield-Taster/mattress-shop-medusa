/**
 * SMS Service
 *
 * Для відправки SMS потрібно налаштувати Twilio:
 * 1. npm install twilio
 * 2. Встановити env змінні: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */

/**
 * Генерувати 6-значний код верифікації
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Відправити SMS з кодом верифікації
 *
 * @param phone - номер телефону
 * @param code - код верифікації
 * @returns true якщо відправлено успішно
 */
export async function sendVerificationSms(
  phone: string,
  code: string
): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[SMS] Verification code for ${phone}: ${code}`)
    console.warn(
      "[SMS] SMS provider not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to send real SMS."
    )
    return true
  }

  try {
    const twilio = require("twilio")
    const client = twilio(accountSid, authToken)

    await client.messages.create({
      body: `Ваш код підтвердження: ${code}`,
      from: fromNumber,
      to: `+38${phone.replace(/^0/, "")}`,
    })

    return true
  } catch (error) {
    console.error("[SMS] Failed to send SMS:", error)
    return false
  }
}

/**
 * Валідувати формат номера телефону
 * Підтримує українські номери у форматах:
 * - +380XXXXXXXXX
 * - 380XXXXXXXXX
 * - 0XXXXXXXXX
 */
export function validatePhoneNumber(phone: string): boolean {
  // Видаляємо пробіли та дефіси
  const cleaned = phone.replace(/[\s-]/g, "")

  // Українські номери
  const ukrainianRegex = /^(\+?380|0)\d{9}$/

  return ukrainianRegex.test(cleaned)
}

/**
 * Нормалізувати номер телефону до формату 0XXXXXXXXX (10 цифр)
 * Приймає будь-який формат: +380XXXXXXXXX, 380XXXXXXXXX, 0XXXXXXXXX
 */
export function normalizePhoneNumber(phone: string): string {
  // Видаляємо все крім цифр
  let cleaned = phone.replace(/\D/g, "")

  // Якщо починається з 380, видаляємо і додаємо 0
  if (cleaned.startsWith("380")) {
    cleaned = "0" + cleaned.slice(3)
  }

  // Якщо не починається з 0, додаємо
  if (!cleaned.startsWith("0") && cleaned.length === 9) {
    cleaned = "0" + cleaned
  }

  return cleaned
}

/**
 * Форматувати номер телефону для відображення: +380 XX XXX XX XX
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhoneNumber(phone)

  if (normalized.length !== 10) {
    return phone // Повертаємо як є, якщо формат некоректний
  }

  // 0XXXXXXXXX -> +380 XX XXX XX XX
  const digits = normalized.slice(1) // Видаляємо перший 0
  return `+380 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
}
