/**
 * SMS Service — TurboSMS
 *
 * Env змінні:
 * - TURBOSMS_API_KEY — API токен з особистого кабінету TurboSMS
 * - TURBOSMS_SENDER — зареєстроване ім'я відправника (альфа-ім'я)
 *
 * Без цих змінних сервіс працює в mock-режимі (логує код в консоль).
 */

const TURBOSMS_API_URL = "https://api.turbosms.ua/message/send.json"

/**
 * Генерувати 6-значний код верифікації
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Конвертувати номер 0XXXXXXXXX → 380XXXXXXXXX для TurboSMS API
 */
function toInternationalFormat(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("0")) {
    return "38" + cleaned
  }
  if (cleaned.startsWith("380")) {
    return cleaned
  }
  return "380" + cleaned
}

/**
 * Відправити SMS з кодом верифікації через TurboSMS
 *
 * @param phone - номер телефону (формат 0XXXXXXXXX)
 * @param code - код верифікації
 * @returns true якщо відправлено успішно
 */
export async function sendVerificationSms(
  phone: string,
  code: string
): Promise<boolean> {
  const apiKey = process.env.TURBOSMS_API_KEY
  const sender = process.env.TURBOSMS_SENDER

  if (!apiKey || !sender) {
    console.log(`[SMS] Verification code for ${phone}: ${code}`)
    console.warn(
      "[SMS] TurboSMS not configured. Set TURBOSMS_API_KEY and TURBOSMS_SENDER to send real SMS."
    )
    return true
  }

  const recipient = toInternationalFormat(phone)

  try {
    const response = await fetch(TURBOSMS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        recipients: [recipient],
        sms: {
          sender,
          text: `Ваш код підтвердження: ${code}`,
        },
      }),
    })

    const data = await response.json()

    // Success codes: 0 (OK), 800 (accepted), 801 (sent), 802/803 (partial)
    const successCodes = [0, 800, 801, 802, 803]

    if (!successCodes.includes(data.response_code)) {
      console.error(
        `[SMS] TurboSMS error [${data.response_code}]: ${data.response_status}`,
        data.response_result
      )
      return false
    }

    // Check per-recipient status
    if (Array.isArray(data.response_result)) {
      const result = data.response_result[0]
      if (result && result.response_code !== 0) {
        console.error(
          `[SMS] TurboSMS recipient error [${result.response_code}]: ${result.response_status}`,
          result.phone
        )
        return false
      }
      console.log(
        `[SMS] Sent verification SMS to ${recipient}, message_id: ${result?.message_id}`
      )
    } else {
      console.log(`[SMS] Sent verification SMS to ${recipient}`)
    }

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
