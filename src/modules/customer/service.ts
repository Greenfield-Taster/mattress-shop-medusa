import { MedusaService } from "@medusajs/framework/utils"
import Customer from "./models/customer"
import type { InferTypeOf } from "@medusajs/framework/types"

// ===== ТИПИ =====

/**
 * Інферований тип для Customer entity
 */
export type CustomerType = InferTypeOf<typeof Customer>

/**
 * DTO для створення Customer
 */
export interface CreateCustomerDTO {
  phone?: string | null
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  avatar?: string | null
  google_id?: string | null
  verification_code?: string | null
  code_expires_at?: Date | null
  last_login_at?: Date | null
  is_active?: boolean
}

/**
 * DTO для оновлення Customer
 */
export interface UpdateCustomerDTO {
  id: string
  phone?: string | null
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  avatar?: string | null
  google_id?: string | null
  verification_code?: string | null
  code_expires_at?: Date | null
  last_login_at?: Date | null
  is_active?: boolean
}

/**
 * CustomerModuleService
 *
 * Розширює MedusaService з типізованими методами.
 *
 * Автоматично отримує методи:
 * - createShopCustomers(data) - створення
 * - updateShopCustomers(data) - оновлення
 * - deleteShopCustomers(ids) - видалення
 * - retrieveShopCustomer(id) - отримання одного запису
 * - listShopCustomers(filters, config) - список
 */
class CustomerModuleService extends MedusaService({
  Customer,
}) {
  /**
   * Знайти користувача за номером телефону
   */
  async findByPhone(phone: string): Promise<CustomerType | null> {
    try {
      // @ts-expect-error - MedusaService генерує метод динамічно
      const [customers] = await this.listShopCustomers({ phone })
      return customers.length > 0 ? customers[0] : null
    } catch {
      return null
    }
  }

  /**
   * Знайти користувача за email
   */
  async findByEmail(email: string): Promise<CustomerType | null> {
    try {
      // @ts-expect-error - MedusaService генерує метод динамічно
      const [customers] = await this.listShopCustomers({ email })
      return customers.length > 0 ? customers[0] : null
    } catch {
      return null
    }
  }

  /**
   * Знайти користувача за Google ID
   */
  async findByGoogleId(googleId: string): Promise<CustomerType | null> {
    try {
      // @ts-expect-error - MedusaService генерує метод динамічно
      const [customers] = await this.listShopCustomers({ google_id: googleId })
      return customers.length > 0 ? customers[0] : null
    } catch {
      return null
    }
  }

  /**
   * Створити нового користувача
   */
  async createCustomer(data: CreateCustomerDTO): Promise<CustomerType> {
    // @ts-expect-error - MedusaService генерує метод динамічно
    return await this.createShopCustomers(data)
  }

  /**
   * Оновити дані користувача
   */
  async updateCustomer(data: UpdateCustomerDTO): Promise<CustomerType> {
    // @ts-expect-error - MedusaService генерує метод динамічно
    return await this.updateShopCustomers(data)
  }

  /**
   * Зберегти код верифікації для користувача
   * @param customerId - ID користувача
   * @param code - 6-значний код
   * @param ttlMinutes - час життя коду в хвилинах (за замовчуванням 5)
   */
  async saveVerificationCode(
    customerId: string,
    code: string,
    ttlMinutes: number = 5
  ): Promise<CustomerType> {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes)

    return await this.updateCustomer({
      id: customerId,
      verification_code: code,
      code_expires_at: expiresAt,
    })
  }

  /**
   * Перевірити код верифікації
   * @returns true якщо код валідний і не прострочений
   */
  async verifyCode(customerId: string, code: string): Promise<boolean> {
    // @ts-expect-error - MedusaService генерує метод динамічно
    const customer = await this.retrieveShopCustomer(customerId)

    if (!customer) return false
    if (!customer.verification_code) return false
    if (customer.verification_code !== code) return false

    // Перевірка TTL
    if (customer.code_expires_at) {
      const now = new Date()
      const expiresAt = new Date(customer.code_expires_at)
      if (now > expiresAt) return false
    }

    return true
  }

  /**
   * Очистити код верифікації після успішного входу
   */
  async clearVerificationCode(customerId: string): Promise<CustomerType> {
    return await this.updateCustomer({
      id: customerId,
      verification_code: null,
      code_expires_at: null,
      last_login_at: new Date(),
    })
  }

  /**
   * Знайти або створити користувача за телефоном
   */
  async findOrCreateByPhone(phone: string): Promise<CustomerType> {
    const existing = await this.findByPhone(phone)
    if (existing) return existing

    return await this.createCustomer({ phone })
  }

  /**
   * Знайти або створити користувача за Google даними
   */
  async findOrCreateByGoogle(data: {
    googleId: string
    email: string
    firstName?: string
    lastName?: string
    avatar?: string
  }): Promise<CustomerType> {
    // Спочатку шукаємо за Google ID
    let customer = await this.findByGoogleId(data.googleId)
    if (customer) {
      // Оновлюємо last_login_at
      return await this.updateCustomer({
        id: customer.id,
        last_login_at: new Date(),
      })
    }

    // Потім шукаємо за email (можливо, користувач раніше входив по SMS з тим самим email)
    customer = await this.findByEmail(data.email)
    if (customer) {
      // Прив'язуємо Google ID до існуючого акаунту
      return await this.updateCustomer({
        id: customer.id,
        google_id: data.googleId,
        avatar: data.avatar || customer.avatar,
        last_login_at: new Date(),
      })
    }

    // Створюємо нового користувача
    return await this.createCustomer({
      google_id: data.googleId,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      avatar: data.avatar,
      last_login_at: new Date(),
    })
  }
}

export default CustomerModuleService
