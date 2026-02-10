import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Table,
  Badge,
  Text,
  Input,
  Select,
  DropdownMenu,
  IconButton,
  toast,
  Toaster,
  usePrompt,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  PlusMini,
  EllipsisHorizontal,
  PencilSquare,
  Trash,
  MagnifyingGlass,
} from "@medusajs/icons"
import { useState } from "react"

// Типи
interface PromoCode {
  id: string
  code: string
  description: string | null
  discount_type: "percentage" | "fixed"
  discount_value: number
  min_order_amount: number
  max_uses: number
  current_uses: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

// Helpers
const formatDiscount = (type: string, value: number): string => {
  if (type === "percentage") {
    return `${value}%`
  }
  return `${value / 100} грн`
}

const formatDate = (date: string | null): string => {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getStatusBadge = (promoCode: PromoCode) => {
  if (!promoCode.is_active) {
    return <Badge color="grey">Неактивний</Badge>
  }

  const now = new Date()

  if (promoCode.starts_at && new Date(promoCode.starts_at) > now) {
    return <Badge color="orange">Очікує</Badge>
  }

  if (promoCode.expires_at && new Date(promoCode.expires_at) < now) {
    return <Badge color="red">Закінчився</Badge>
  }

  if (promoCode.max_uses > 0 && promoCode.current_uses >= promoCode.max_uses) {
    return <Badge color="red">Вичерпано</Badge>
  }

  return <Badge color="green">Активний</Badge>
}

/**
 * Список промокодів
 * URL: /app/promo-codes
 */
const PromoCodesPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterActive, setFilterActive] = useState<string>("")

  // Запит на отримання списку промокодів
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const response = await fetch("/admin/promo-codes", {
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to fetch promo codes")
      }

      return response.json()
    },
  })

  // Мутація для видалення
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/promo-codes/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to delete promo code")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", { description: "Промокод видалено" })
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  // Мутація для зміни статусу
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const response = await fetch(`/admin/promo-codes/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to update promo code")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", { description: "Статус змінено" })
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  const promoCodes: PromoCode[] = data?.promo_codes || []

  // Фільтрація промокодів
  const filteredPromoCodes = promoCodes.filter((pc) => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      if (!pc.code.toLowerCase().includes(search) &&
          !pc.description?.toLowerCase().includes(search)) {
        return false
      }
    }
    if (filterActive === "active" && !pc.is_active) return false
    if (filterActive === "inactive" && pc.is_active) return false
    return true
  })

  // Видалення промокоду
  const handleDelete = async (id: string, code: string) => {
    const confirmed = await prompt({
      title: "Видалити промокод?",
      description: `Ви впевнені що хочете видалити "${code}"? Цю дію неможливо скасувати.`,
      confirmText: "Видалити",
      cancelText: "Скасувати",
    })

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Toaster />

      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Промокоди</Heading>
            <Text className="text-gray-500">
              {isLoading ? "Завантаження..." : `${promoCodes.length} промокодів`}
            </Text>
          </div>
          <Button variant="primary" onClick={() => navigate("/promo-codes/create")}>
            <PlusMini className="mr-2" />
            Додати промокод
          </Button>
        </div>
      </Container>

      {/* Search & Filter */}
      <Container className="p-0">
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Пошук за кодом або описом..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filterActive || "all"}
            onValueChange={(value) => setFilterActive(value === "all" ? "" : value)}
          >
            <Select.Trigger className="w-48">
              <Select.Value placeholder="Всі статуси" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">Всі статуси</Select.Item>
              <Select.Item value="active">Активні</Select.Item>
              <Select.Item value="inactive">Неактивні</Select.Item>
            </Select.Content>
          </Select>
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
              <Button variant="secondary" onClick={() => refetch()}>
                Спробувати знову
              </Button>
            </div>
          ) : filteredPromoCodes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏷️</div>
              <Heading level="h2" className="mb-2">
                Промокодів поки немає
              </Heading>
              <Text className="text-gray-500 mb-6">
                Створіть перший промокод для вашого магазину
              </Text>
              <Button variant="primary" onClick={() => navigate("/promo-codes/create")}>
                <PlusMini className="mr-2" />
                Додати промокод
              </Button>
            </div>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Код</Table.HeaderCell>
                  <Table.HeaderCell>Знижка</Table.HeaderCell>
                  <Table.HeaderCell>Мін. сума</Table.HeaderCell>
                  <Table.HeaderCell>Використання</Table.HeaderCell>
                  <Table.HeaderCell>Період дії</Table.HeaderCell>
                  <Table.HeaderCell>Статус</Table.HeaderCell>
                  <Table.HeaderCell>Створено</Table.HeaderCell>
                  <Table.HeaderCell className="w-12"></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredPromoCodes.map((promoCode) => (
                  <Table.Row
                    key={promoCode.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/promo-codes/${promoCode.id}/edit`)}
                  >
                    {/* Код */}
                    <Table.Cell>
                      <div>
                        <Text className="font-mono font-bold text-lg">
                          {promoCode.code}
                        </Text>
                        {promoCode.description && (
                          <Text className="text-xs text-gray-500">
                            {promoCode.description}
                          </Text>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Знижка */}
                    <Table.Cell>
                      <Badge
                        color={promoCode.discount_type === "percentage" ? "purple" : "blue"}
                      >
                        {formatDiscount(promoCode.discount_type, promoCode.discount_value)}
                      </Badge>
                    </Table.Cell>

                    {/* Мін. сума */}
                    <Table.Cell>
                      {promoCode.min_order_amount > 0 ? (
                        <Text>{promoCode.min_order_amount / 100} грн</Text>
                      ) : (
                        <Text className="text-gray-400">—</Text>
                      )}
                    </Table.Cell>

                    {/* Використання */}
                    <Table.Cell>
                      <Text>
                        {promoCode.current_uses}
                        {promoCode.max_uses > 0 ? ` / ${promoCode.max_uses}` : " / ∞"}
                      </Text>
                    </Table.Cell>

                    {/* Період дії */}
                    <Table.Cell>
                      <div className="text-sm">
                        {promoCode.starts_at || promoCode.expires_at ? (
                          <>
                            <div>
                              <span className="text-gray-500">Від: </span>
                              {formatDate(promoCode.starts_at)}
                            </div>
                            <div>
                              <span className="text-gray-500">До: </span>
                              {formatDate(promoCode.expires_at)}
                            </div>
                          </>
                        ) : (
                          <Text className="text-gray-400">Безстроковий</Text>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Статус */}
                    <Table.Cell>{getStatusBadge(promoCode)}</Table.Cell>

                    {/* Дата створення */}
                    <Table.Cell>
                      <Text className="text-gray-500 text-sm">
                        {formatDateTime(promoCode.created_at)}
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
                            onClick={() => navigate(`/promo-codes/${promoCode.id}/edit`)}
                          >
                            <PencilSquare className="mr-2" />
                            Редагувати
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: promoCode.id,
                                is_active: !promoCode.is_active,
                              })
                            }
                          >
                            {promoCode.is_active ? "Деактивувати" : "Активувати"}
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            onClick={() => handleDelete(promoCode.id, promoCode.code)}
                            className="text-red-500"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash className="mr-2" />
                            Видалити
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
  label: "Промокоди",
})

export default PromoCodesPage
