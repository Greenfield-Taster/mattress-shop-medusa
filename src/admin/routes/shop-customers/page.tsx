import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Table,
  Badge,
  Text,
  DropdownMenu,
  IconButton,
  toast,
  Toaster,
  usePrompt,
  Input,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { EllipsisHorizontal, PencilSquare, XCircle, CheckCircle, MagnifyingGlass } from "@medusajs/icons"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

// Типи
interface ShopCustomer {
  id: string
  phone: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  avatar: string | null
  city: string | null
  address: string | null
  google_id: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

// Helpers
const formatDate = (date: string | null): string => {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getAuthMethod = (customer: ShopCustomer): string => {
  if (customer.google_id) return "Google"
  if (customer.phone) return "SMS"
  return "—"
}

/**
 * Список користувачів магазину
 * URL: /app/shop-customers
 */
const ShopCustomersPage = () => {
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")

  // Запит на отримання списку користувачів
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["shop-customers"],
    queryFn: async () => {
      const response = await fetch("/admin/shop-customers", {
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to fetch customers")
      }

      return response.json()
    },
  })

  // Мутація для зміни статусу активності
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/admin/shop-customers/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to update customer")
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      toast.success("Успіх", {
        description: variables.isActive ? "Користувача активовано" : "Користувача деактивовано",
      })
      queryClient.invalidateQueries({ queryKey: ["shop-customers"] })
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  const customers: ShopCustomer[] = data?.customers || []

  // Фільтрація користувачів
  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      customer.email?.toLowerCase().includes(search) ||
      customer.phone?.includes(search) ||
      customer.first_name?.toLowerCase().includes(search) ||
      customer.last_name?.toLowerCase().includes(search)
    )
  })

  // Зміна статусу
  const handleToggleActive = async (customer: ShopCustomer) => {
    const newStatus = !customer.is_active
    const action = newStatus ? "активувати" : "деактивувати"
    const name = customer.first_name || customer.email || customer.phone || "користувача"

    const confirmed = await prompt({
      title: `${newStatus ? "Активувати" : "Деактивувати"} користувача?`,
      description: `Ви впевнені що хочете ${action} "${name}"?`,
      confirmText: newStatus ? "Активувати" : "Деактивувати",
      cancelText: "Скасувати",
    })

    if (confirmed) {
      toggleActiveMutation.mutate({ id: customer.id, isActive: newStatus })
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Toaster />

      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Користувачі магазину</Heading>
            <Text className="text-gray-500">
              {isLoading ? "Завантаження..." : `${customers.length} користувачів`}
            </Text>
          </div>
        </div>
      </Container>

      {/* Search */}
      <Container className="p-0">
        <div className="px-6 py-4">
          <div className="relative max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Пошук за email, телефоном або ім'ям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Container>

      {/* Content */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-pulse">Завантаження...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Text className="text-red-500 mb-4">
                Помилка завантаження: {(error as Error).message}
              </Text>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                Спробувати знову
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👤</div>
              <Heading level="h2" className="mb-2">
                {searchQuery ? "Користувачів не знайдено" : "Користувачів поки немає"}
              </Heading>
              <Text className="text-gray-500">
                {searchQuery
                  ? "Спробуйте змінити параметри пошуку"
                  : "Коли користувачі зареєструються, вони з'являться тут"}
              </Text>
            </div>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell className="w-12"></Table.HeaderCell>
                  <Table.HeaderCell>Користувач</Table.HeaderCell>
                  <Table.HeaderCell>Контакт</Table.HeaderCell>
                  <Table.HeaderCell>Метод входу</Table.HeaderCell>
                  <Table.HeaderCell>Статус</Table.HeaderCell>
                  <Table.HeaderCell>Останній вхід</Table.HeaderCell>
                  <Table.HeaderCell>Дата реєстрації</Table.HeaderCell>
                  <Table.HeaderCell className="w-12"></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredCustomers.map((customer) => (
                  <Table.Row key={customer.id} className="hover:bg-gray-50">
                    {/* Avatar */}
                    <Table.Cell>
                      <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden">
                        {customer.avatar ? (
                          <img
                            src={customer.avatar}
                            alt={customer.first_name || "Avatar"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                            👤
                          </div>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Ім'я */}
                    <Table.Cell>
                      <div>
                        <Text className="font-medium">
                          {customer.first_name || customer.last_name
                            ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
                            : "Без імені"}
                        </Text>
                        <Text className="text-xs text-gray-500">ID: {customer.id.slice(0, 12)}...</Text>
                      </div>
                    </Table.Cell>

                    {/* Контакт */}
                    <Table.Cell>
                      <div>
                        {customer.email && (
                          <Text className="text-sm">{customer.email}</Text>
                        )}
                        {customer.phone && (
                          <Text className="text-sm text-gray-500">{customer.phone}</Text>
                        )}
                        {!customer.email && !customer.phone && (
                          <Text className="text-gray-400">—</Text>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Метод входу */}
                    <Table.Cell>
                      <Badge color={customer.google_id ? "blue" : "purple"}>
                        {getAuthMethod(customer)}
                      </Badge>
                    </Table.Cell>

                    {/* Статус */}
                    <Table.Cell>
                      <Badge color={customer.is_active ? "green" : "red"}>
                        {customer.is_active ? "Активний" : "Деактивований"}
                      </Badge>
                    </Table.Cell>

                    {/* Останній вхід */}
                    <Table.Cell>
                      <Text className="text-gray-500 text-sm">
                        {formatDate(customer.last_login_at)}
                      </Text>
                    </Table.Cell>

                    {/* Дата реєстрації */}
                    <Table.Cell>
                      <Text className="text-gray-500 text-sm">
                        {formatDate(customer.created_at)}
                      </Text>
                    </Table.Cell>

                    {/* Actions */}
                    <Table.Cell>
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <IconButton variant="transparent">
                            <EllipsisHorizontal />
                          </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                          <DropdownMenu.Item
                            onClick={() => navigate(`/shop-customers/${customer.id}/edit`)}
                          >
                            <PencilSquare className="mr-2" />
                            Редагувати
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            onClick={() => handleToggleActive(customer)}
                            disabled={toggleActiveMutation.isPending}
                          >
                            {customer.is_active ? (
                              <>
                                <XCircle className="mr-2" />
                                Деактивувати
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2" />
                                Активувати
                              </>
                            )}
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </Container>
    </div>
  )
}

// Конфігурація роуту - додає пункт в sidebar
export const config = defineRouteConfig({
  label: "Користувачі",
})

export default ShopCustomersPage
