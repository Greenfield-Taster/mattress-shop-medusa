import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Table,
  Badge,
  Text,
  Input,
  DropdownMenu,
  IconButton,
  toast,
  Toaster,
  Select,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  EllipsisHorizontal,
  Eye,
  TruckFast,
  MagnifyingGlass,
} from "@medusajs/icons"
import { useState } from "react"

// Типи
interface OrderItem {
  id: string
  title: string
  image: string | null
  size: string | null
  firmness: string | null
  quantity: number
  unit_price: number
  total: number
}

interface Order {
  id: string
  order_number: string
  customer_id: string | null
  full_name: string
  phone: string
  email: string
  comment: string | null
  status: string
  payment_status: string
  payment_method: string
  delivery_method: string
  delivery_city: string | null
  delivery_city_ref: string | null
  delivery_address: string | null
  delivery_warehouse: string | null
  delivery_price: number
  delivery_price_type: string
  subtotal: number
  discount_amount: number
  total: number
  promo_code: string | null
  promo_discount_type: string | null
  promo_discount_value: number | null
  company_name: string | null
  edrpou: string | null
  company_address: string | null
  admin_notes: string | null
  items: OrderItem[]
  items_count: number
  created_at: string
  updated_at: string
}

// Статуси замовлення
const ORDER_STATUSES = [
  { value: "pending", label: "Нове", color: "orange" as const },
  { value: "confirmed", label: "Підтверджено", color: "blue" as const },
  { value: "processing", label: "Обробляється", color: "purple" as const },
  { value: "shipping", label: "В дорозі", color: "blue" as const },
  { value: "delivered", label: "Доставлено", color: "green" as const },
  { value: "cancelled", label: "Скасовано", color: "red" as const },
]

const PAYMENT_STATUSES = [
  { value: "pending", label: "Очікує", color: "orange" as const },
  { value: "paid", label: "Оплачено", color: "green" as const },
  { value: "failed", label: "Помилка", color: "red" as const },
  { value: "refunded", label: "Повернено", color: "grey" as const },
]

const DELIVERY_METHODS: Record<string, string> = {
  "nova-poshta": "Нова Пошта",
  "delivery": "Delivery",
  "cat": "SAT",
  "courier": "Кур'єр",
  "pickup": "Самовивіз",
}

const PAYMENT_METHODS: Record<string, string> = {
  "cash-on-delivery": "При отриманні",
  "card-online": "Картка онлайн",
  "google-apple-pay": "Google/Apple Pay",
  "invoice": "Рахунок",
}

const DELIVERY_PRICE_TYPES: Record<string, string> = {
  "free": "Безкоштовно",
  "fixed": "Фіксована",
  "carrier": "За тарифами перевізника",
}

// Helpers
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatMoney = (amount: number): string => {
  return `${amount.toLocaleString("uk-UA")} ₴`
}

const getStatusBadge = (status: string) => {
  const statusInfo = ORDER_STATUSES.find((s) => s.value === status)
  return (
    <Badge color={statusInfo?.color || "grey"}>
      {statusInfo?.label || status}
    </Badge>
  )
}

const getPaymentStatusBadge = (status: string) => {
  const statusInfo = PAYMENT_STATUSES.find((s) => s.value === status)
  return (
    <Badge color={statusInfo?.color || "grey"}>
      {statusInfo?.label || status}
    </Badge>
  )
}

/**
 * Сторінка замовлень
 * URL: /app/shop-orders
 */
const ShopOrdersPage = () => {
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  // Запит на отримання замовлень
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["shop-orders", filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterStatus) params.append("status", filterStatus)

      const response = await fetch(`/admin/shop-orders?${params}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }

      return response.json()
    },
  })

  // Мутація для оновлення статусу
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      payment_status,
    }: {
      id: string
      status?: string
      payment_status?: string
    }) => {
      const response = await fetch(`/admin/shop-orders/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, payment_status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update order")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", { description: "Статус оновлено" })
      queryClient.invalidateQueries({ queryKey: ["shop-orders"] })
    },
    onError: () => {
      toast.error("Помилка", { description: "Не вдалося оновити статус" })
    },
  })

  const orders: Order[] = data?.orders || []

  // Фільтрація замовлень (клієнтська)
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      order.order_number.toLowerCase().includes(search) ||
      order.full_name.toLowerCase().includes(search) ||
      order.phone.includes(search)
    )
  })

  return (
    <div className="flex flex-col gap-y-4">
      <Toaster />

      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Замовлення</Heading>
            <Text className="text-gray-500">
              {isLoading ? "Завантаження..." : `${data?.count || 0} замовлень`}
            </Text>
          </div>

          {/* Пошук та фільтр */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Номер, ім'я або телефон..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select
              value={filterStatus || "all"}
              onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}
            >
              <Select.Trigger>
                <Select.Value placeholder="Всі статуси" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">Всі статуси</Select.Item>
                {ORDER_STATUSES.map((status) => (
                  <Select.Item key={status.value} value={status.value}>
                    {status.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>
      </Container>

      {/* Orders Table */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-pulse">Завантаження...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Text className="text-red-500 mb-4">Помилка завантаження</Text>
              <button onClick={() => refetch()} className="text-blue-500">
                Спробувати знову
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <Heading level="h2" className="mb-2">
                Замовлень поки немає
              </Heading>
              <Text className="text-gray-500">
                Замовлення з'являться тут після оформлення
              </Text>
            </div>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Номер</Table.HeaderCell>
                  <Table.HeaderCell>Клієнт</Table.HeaderCell>
                  <Table.HeaderCell>Товари</Table.HeaderCell>
                  <Table.HeaderCell>Сума</Table.HeaderCell>
                  <Table.HeaderCell>Доставка</Table.HeaderCell>
                  <Table.HeaderCell>Оплата</Table.HeaderCell>
                  <Table.HeaderCell>Статус</Table.HeaderCell>
                  <Table.HeaderCell>Дата</Table.HeaderCell>
                  <Table.HeaderCell className="w-12"></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredOrders.map((order) => (
                  <Table.Row
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Номер */}
                    <Table.Cell>
                      <Text className="font-mono font-bold">
                        {order.order_number}
                      </Text>
                    </Table.Cell>

                    {/* Клієнт */}
                    <Table.Cell>
                      <div>
                        <Text className="font-medium">{order.full_name}</Text>
                        <Text className="text-xs text-gray-500">
                          {order.phone}
                        </Text>
                      </div>
                    </Table.Cell>

                    {/* Товари */}
                    <Table.Cell>
                      <Text>{order.items_count} шт.</Text>
                    </Table.Cell>

                    {/* Сума */}
                    <Table.Cell>
                      <div>
                        <Text className="font-bold">
                          {formatMoney(order.total)}
                        </Text>
                        {order.discount_amount > 0 && (
                          <Text className="text-xs text-green-600">
                            -{formatMoney(order.discount_amount)}
                          </Text>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Доставка */}
                    <Table.Cell>
                      <div>
                        <Text className="text-sm">
                          {DELIVERY_METHODS[order.delivery_method] ||
                            order.delivery_method}
                        </Text>
                        {order.delivery_city && (
                          <Text className="text-xs text-gray-500">
                            {order.delivery_city}
                          </Text>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Оплата */}
                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <Text className="text-xs">
                          {PAYMENT_METHODS[order.payment_method] ||
                            order.payment_method}
                        </Text>
                        {getPaymentStatusBadge(order.payment_status)}
                      </div>
                    </Table.Cell>

                    {/* Статус */}
                    <Table.Cell>{getStatusBadge(order.status)}</Table.Cell>

                    {/* Дата */}
                    <Table.Cell>
                      <Text className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </Text>
                    </Table.Cell>

                    {/* Actions */}
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <IconButton variant="transparent">
                            <EllipsisHorizontal />
                          </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                          <DropdownMenu.Item
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="mr-2" />
                            Переглянути
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Label>Змінити статус</DropdownMenu.Label>
                          {ORDER_STATUSES.map((status) => (
                            <DropdownMenu.Item
                              key={status.value}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: order.id,
                                  status: status.value,
                                })
                              }
                              disabled={order.status === status.value}
                            >
                              {status.label}
                            </DropdownMenu.Item>
                          ))}
                          <DropdownMenu.Separator />
                          <DropdownMenu.Label>Статус оплати</DropdownMenu.Label>
                          {PAYMENT_STATUSES.map((status) => (
                            <DropdownMenu.Item
                              key={status.value}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: order.id,
                                  payment_status: status.value,
                                })
                              }
                              disabled={order.payment_status === status.value}
                            >
                              {status.label}
                            </DropdownMenu.Item>
                          ))}
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-ui-bg-base rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-ui-border-base">
              <div className="flex items-center justify-between">
                <div>
                  <Heading level="h2">
                    Замовлення {selectedOrder.order_number}
                  </Heading>
                  <Text className="text-ui-fg-subtle">
                    {formatDate(selectedOrder.created_at)}
                    {selectedOrder.updated_at !== selectedOrder.created_at && (
                      <> (оновлено: {formatDate(selectedOrder.updated_at)})</>
                    )}
                  </Text>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedOrder.status)}
                  {getPaymentStatusBadge(selectedOrder.payment_status)}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Клієнт */}
              <div>
                <Heading level="h3" className="mb-2">
                  Клієнт
                </Heading>
                <div className="bg-ui-bg-subtle rounded-lg p-4 space-y-1">
                  <Text>
                    <strong>ПІБ:</strong> {selectedOrder.full_name}
                  </Text>
                  <Text>
                    <strong>Телефон:</strong> {selectedOrder.phone}
                  </Text>
                  <Text>
                    <strong>Email:</strong> {selectedOrder.email}
                  </Text>
                  {selectedOrder.customer_id && (
                    <Text className="text-xs text-ui-fg-subtle">
                      Зареєстрований користувач (ID: {selectedOrder.customer_id})
                    </Text>
                  )}
                  {!selectedOrder.customer_id && (
                    <Text className="text-xs text-ui-fg-subtle">
                      Гостьове замовлення
                    </Text>
                  )}
                </div>
              </div>

              {/* Коментар */}
              {selectedOrder.comment && (
                <div>
                  <Heading level="h3" className="mb-2">
                    Коментар клієнта
                  </Heading>
                  <div className="bg-ui-bg-subtle rounded-lg p-4">
                    <Text className="whitespace-pre-wrap">{selectedOrder.comment}</Text>
                  </div>
                </div>
              )}

              {/* Доставка */}
              <div>
                <Heading level="h3" className="mb-2">
                  Доставка
                </Heading>
                <div className="bg-ui-bg-subtle rounded-lg p-4 space-y-1">
                  <Text>
                    <strong>Спосіб:</strong>{" "}
                    {DELIVERY_METHODS[selectedOrder.delivery_method] ||
                      selectedOrder.delivery_method}
                  </Text>
                  {selectedOrder.delivery_city && (
                    <Text>
                      <strong>Місто:</strong> {selectedOrder.delivery_city}
                    </Text>
                  )}
                  {selectedOrder.delivery_warehouse && (
                    <Text>
                      <strong>Відділення:</strong>{" "}
                      {selectedOrder.delivery_warehouse}
                    </Text>
                  )}
                  {selectedOrder.delivery_address && (
                    <Text>
                      <strong>Адреса:</strong> {selectedOrder.delivery_address}
                    </Text>
                  )}
                  <Text>
                    <strong>Вартість доставки:</strong>{" "}
                    {selectedOrder.delivery_price_type === "free"
                      ? "Безкоштовно"
                      : selectedOrder.delivery_price_type === "carrier"
                        ? "За тарифами перевізника"
                        : formatMoney(selectedOrder.delivery_price)}
                  </Text>
                </div>
              </div>

              {/* Оплата */}
              <div>
                <Heading level="h3" className="mb-2">
                  Оплата
                </Heading>
                <div className="bg-ui-bg-subtle rounded-lg p-4 space-y-1">
                  <Text>
                    <strong>Спосіб:</strong>{" "}
                    {PAYMENT_METHODS[selectedOrder.payment_method] ||
                      selectedOrder.payment_method}
                  </Text>
                  <Text>
                    <strong>Статус:</strong>{" "}
                    {PAYMENT_STATUSES.find((s) => s.value === selectedOrder.payment_status)?.label ||
                      selectedOrder.payment_status}
                  </Text>
                  {/* Дані юридичної особи */}
                  {selectedOrder.company_name && (
                    <>
                      <div className="border-t border-ui-border-base mt-2 pt-2">
                        <Text className="text-xs text-ui-fg-subtle mb-1">Юридична особа:</Text>
                        <Text>
                          <strong>Компанія:</strong> {selectedOrder.company_name}
                        </Text>
                        {selectedOrder.edrpou && (
                          <Text>
                            <strong>ЄДРПОУ:</strong> {selectedOrder.edrpou}
                          </Text>
                        )}
                        {selectedOrder.company_address && (
                          <Text>
                            <strong>Адреса компанії:</strong> {selectedOrder.company_address}
                          </Text>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Товари */}
              <div>
                <Heading level="h3" className="mb-2">
                  Товари ({selectedOrder.items_count} шт.)
                </Heading>
                <div className="border border-ui-border-base rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-ui-bg-subtle">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">
                          Товар
                        </th>
                        <th className="text-center p-3 text-sm font-medium">
                          К-сть
                        </th>
                        <th className="text-right p-3 text-sm font-medium">
                          Ціна
                        </th>
                        <th className="text-right p-3 text-sm font-medium">
                          Сума
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-t border-ui-border-base">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <div>
                                <Text className="font-medium">{item.title}</Text>
                                {(item.size || item.firmness) && (
                                  <Text className="text-xs text-ui-fg-subtle">
                                    {[item.size, item.firmness]
                                      .filter(Boolean)
                                      .join(" | ")}
                                  </Text>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">
                            {formatMoney(item.unit_price)}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatMoney(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Підсумок */}
              <div className="bg-ui-bg-subtle rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <Text>Сума товарів:</Text>
                  <Text>{formatMoney(selectedOrder.subtotal)}</Text>
                </div>
                {selectedOrder.delivery_price > 0 && (
                  <div className="flex justify-between mb-2">
                    <Text>Доставка:</Text>
                    <Text>{formatMoney(selectedOrder.delivery_price)}</Text>
                  </div>
                )}
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between mb-2 text-ui-fg-interactive">
                    <Text>
                      Знижка
                      {selectedOrder.promo_code && (
                        <>
                          {" "}({selectedOrder.promo_code}
                          {selectedOrder.promo_discount_type === "percentage" && selectedOrder.promo_discount_value
                            ? ` — ${selectedOrder.promo_discount_value}%`
                            : selectedOrder.promo_discount_type === "fixed" && selectedOrder.promo_discount_value
                              ? ` — ${selectedOrder.promo_discount_value} ₴`
                              : ""}
                          )
                        </>
                      )}
                      :
                    </Text>
                    <Text>-{formatMoney(selectedOrder.discount_amount)}</Text>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-ui-border-base font-bold text-lg">
                  <Text>Разом:</Text>
                  <Text>{formatMoney(selectedOrder.total)}</Text>
                </div>
              </div>

              {/* Примітки адміністратора */}
              {selectedOrder.admin_notes && (
                <div>
                  <Heading level="h3" className="mb-2">
                    Примітки адміністратора
                  </Heading>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <Text className="whitespace-pre-wrap">{selectedOrder.admin_notes}</Text>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-ui-border-base flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-ui-bg-subtle-hover rounded-lg hover:bg-ui-bg-subtle-pressed text-ui-fg-base"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Конфігурація роуту
export const config = defineRouteConfig({
  label: "Замовлення",
  icon: TruckFast,
})

export default ShopOrdersPage
