/**
 * SMS Service - Mock implementation
 *
 * В dev режимі код 123456 завжди валідний.
 * Для production замінити на Twilio/інший SMS провайдер.
 */

/**
 * Генерувати 6-значний код верифікації
 */
export function generateVerificationCode(): string {
  // В dev режимі можна використовувати фіксований код для тестування
  if (process.env.NODE_ENV === "development" && process.env.SMS_DEV_CODE) {
    return process.env.SMS_DEV_CODE
  }

  // Генеруємо випадковий 6-значний код
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Перевірити чи це dev код (123456)
 * В dev режимі цей код завжди валідний
 */
export function isDevCode(code: string): boolean {
  return process.env.NODE_ENV === "development" && code === "123456"
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
  // В dev режимі просто логуємо
  if (process.env.NODE_ENV === "development") {
    console.log(`
╔════════════════════════════════════════════╗
║         SMS VERIFICATION CODE              ║
╠════════════════════════════════════════════╣
║  Phone: ${phone.padEnd(32)}║
║  Code:  ${code.padEnd(32)}║
║                                            ║
║  Dev mode: use 123456 to bypass            ║
╚════════════════════════════════════════════╝
    `)
    return true
  }

  // TODO: Інтеграція з реальним SMS провайдером (Twilio, etc.)
  // Приклад для Twilio:
  //
  // import twilio from "twilio"
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  //
  // await client.messages.create({
  //   body: `Ваш код підтвердження: ${code}`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phone
  // })

  console.log(`[SMS] Would send code ${code} to ${phone}`)
  return true
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
