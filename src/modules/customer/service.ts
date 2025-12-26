import { MedusaService } from "@medusajs/framework/utils"
import Customer from "./models/customer"
import type { InferTypeOf } from "@medusajs/framework/types"

// ===== ТИПИ =====

export type CustomerType = InferTypeOf<typeof Customer>

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
 * Методи MedusaService базуються на імені змінної моделі (Customer):
 * - createCustomers / listCustomers / retrieveCustomer / updateCustomers / deleteCustomers
 */
class CustomerModuleService extends MedusaService({
  Customer,
}) {
  /**
   * Знайти користувача за номером телефону
   */
  async findByPhone(phone: string): Promise<CustomerType | null> {
    try {
      const customers = await this.listCustomers({ phone })
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
      const customers = await this.listCustomers({ email })
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
      const customers = await this.listCustomers({ google_id: googleId })
      return customers.length > 0 ? customers[0] : null
    } catch {
      return null
    }
  }

  /**
   * Створити нового користувача
   */
  async createCustomer(data: CreateCustomerDTO): Promise<CustomerType> {
    return await this.createCustomers(data)
  }

  /**
   * Оновити дані користувача
   */
  async updateCustomerData(data: UpdateCustomerDTO): Promise<CustomerType> {
    return await this.updateCustomers(data)
  }

  /**
   * Зберегти код верифікації для користувача
   */
  async saveVerificationCode(
    customerId: string,
    code: string,
    ttlMinutes: number = 5
  ): Promise<CustomerType> {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes)

    return await this.updateCustomerData({
      id: customerId,
      verification_code: code,
      code_expires_at: expiresAt,
    })
  }

  /**
   * Перевірити код верифікації
   */
  async verifyCode(customerId: string, code: string): Promise<boolean> {
    const customer = await this.retrieveCustomer(customerId)

    if (!customer) return false
    if (!customer.verification_code) return false
    if (customer.verification_code !== code) return false

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
    return await this.updateCustomerData({
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
      return await this.updateCustomerData({
        id: customer.id,
        last_login_at: new Date(),
      })
    }

    // Потім шукаємо за email
    customer = await this.findByEmail(data.email)
    if (customer) {
      return await this.updateCustomerData({
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
