import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOMER_MODULE } from "../../../modules/customer"
import type CustomerModuleService from "../../../modules/customer/service"

/**
 * GET /admin/shop-customers
 *
 * Отримує список всіх користувачів магазину.
 * Доступно тільки для адміністраторів.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerService = req.scope.resolve<CustomerModuleService>(CUSTOMER_MODULE)

    const customers = await customerService.listCustomers({})

    // Сортуємо за датою створення (найновіші першими)
    const sortedCustomers = customers.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })

    return res.status(200).json({
      customers: sortedCustomers,
      count: sortedCustomers.length,
    })
  } catch (error) {
    console.error("[admin/shop-customers] Error:", error)
    return res.status(500).json({
      message: "Внутрішня помилка сервера",
    })
  }
}
