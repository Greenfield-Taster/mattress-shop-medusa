import { ExecArgs } from "@medusajs/framework/types"
import { CUSTOMER_MODULE } from "../modules/customer"
import CustomerModuleService from "../modules/customer/service"

export default async function checkCustomers({ container }: ExecArgs) {
  const customerService = container.resolve<CustomerModuleService>(CUSTOMER_MODULE)

  // Список всіх користувачів - MedusaService повертає масив напряму
  const result = await customerService.listCustomers({})

  console.log("\n=== DEBUG: Raw result ===")
  console.log("Type:", typeof result)
  console.log("Is array:", Array.isArray(result))
  console.log("Result:", JSON.stringify(result, null, 2))

  // Перевіряємо формат результату
  const customers = Array.isArray(result) ? result : (result as any)?.[0] || []

  console.log("\n=== SHOP CUSTOMERS ===")
  console.log(`Total: ${customers.length}`)
  console.log("")

  for (const customer of customers) {
    console.log(`ID: ${customer.id}`)
    console.log(`  Email: ${customer.email}`)
    console.log(`  Phone: ${customer.phone}`)
    console.log(`  Name: ${customer.first_name} ${customer.last_name}`)
    console.log(`  Google ID: ${customer.google_id}`)
    console.log(`  Avatar: ${customer.avatar}`)
    console.log(`  Last login: ${customer.last_login_at}`)
    console.log("")
  }
}
