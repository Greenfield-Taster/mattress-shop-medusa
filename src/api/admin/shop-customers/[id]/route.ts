import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOMER_MODULE } from "../../../../modules/customer"
import type CustomerModuleService from "../../../../modules/customer/service"

interface UpdateCustomerBody {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  city?: string
  address?: string
  avatar?: string
  is_active?: boolean
}

/**
 * GET /admin/shop-customers/:id
 *
 * Отримує дані конкретного користувача.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params

    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)
    const customer = await customerService.retrieveCustomer(id)

    if (!customer) {
      return res.status(404).json({
        message: "Користувача не знайдено",
      })
    }

    return res.status(200).json({
      customer,
    })
  } catch (error) {
    console.error("[admin/shop-customers/:id GET] Error:", error)
    return res.status(500).json({
      message: "Внутрішня помилка сервера",
    })
  }
}

/**
 * PUT /admin/shop-customers/:id
 *
 * Оновлює дані користувача (ім'я, email, статус активності).
 */
export async function PUT(
  req: MedusaRequest<UpdateCustomerBody>,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const { first_name, last_name, email, phone, city, address, avatar, is_active } = req.body

    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)

    // Перевіряємо чи існує користувач
    const existingCustomer = await customerService.retrieveCustomer(id)

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Користувача не знайдено",
      })
    }

    // Якщо змінюється email, перевіряємо унікальність
    if (email && email !== existingCustomer.email) {
      const emailExists = await customerService.findByEmail(email)
      if (emailExists && emailExists.id !== id) {
        return res.status(400).json({
          message: "Цей email вже використовується іншим користувачем",
        })
      }
    }

    // Якщо змінюється телефон, перевіряємо унікальність
    if (phone && phone !== existingCustomer.phone) {
      const phoneExists = await customerService.findByPhone(phone)
      if (phoneExists && phoneExists.id !== id) {
        return res.status(400).json({
          message: "Цей телефон вже використовується іншим користувачем",
        })
      }
    }

    // Оновлюємо
    const updatedCustomer = await customerService.updateCustomerData({
      id,
      first_name: first_name ?? existingCustomer.first_name,
      last_name: last_name ?? existingCustomer.last_name,
      email: email ?? existingCustomer.email,
      phone: phone ?? existingCustomer.phone,
      city: city ?? existingCustomer.city,
      address: address ?? existingCustomer.address,
      avatar: avatar ?? existingCustomer.avatar,
      is_active: is_active ?? existingCustomer.is_active,
    })

    return res.status(200).json({
      customer: updatedCustomer,
    })
  } catch (error) {
    console.error("[admin/shop-customers/:id PUT] Error:", error)
    return res.status(500).json({
      message: "Внутрішня помилка сервера",
    })
  }
}

/**
 * DELETE /admin/shop-customers/:id
 *
 * Видаляє користувача (або деактивує, якщо soft delete).
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params

    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)

    // Перевіряємо чи існує
    const existingCustomer = await customerService.retrieveCustomer(id)

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Користувача не знайдено",
      })
    }

    // Soft delete - деактивуємо замість повного видалення
    await customerService.updateCustomerData({
      id,
      is_active: false,
    })

    return res.status(200).json({
      success: true,
      message: "Користувача деактивовано",
    })
  } catch (error) {
    console.error("[admin/shop-customers/:id DELETE] Error:", error)
    return res.status(500).json({
      message: "Внутрішня помилка сервера",
    })
  }
}
