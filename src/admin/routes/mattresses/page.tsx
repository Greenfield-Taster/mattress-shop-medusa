import { defineRouteConfig } from "@medusajs/admin-sdk"
import { 
  Container, 
  Heading, 
  Button, 
  Table, 
  Badge, 
  Text,
  DropdownMenu,
  IconButton,
  toast,
  Toaster,
  usePrompt,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { PlusMini, EllipsisHorizontal, PencilSquare, Trash, Eye } from "@medusajs/icons"

// Типи
interface MattressAttributes {
  id: string
  height: number
  hardness: string
  block_type: string
  cover_type: string
  max_weight: number
  is_new: boolean
  discount_percent: number
}

interface Mattress {
  id: string
  title: string
  handle: string
  status: string
  thumbnail: string | null
  created_at: string
  variants: Array<{
    id: string
    title: string
    prices: Array<{ amount: number; currency_code: string }>
  }>
  mattress_attributes: MattressAttributes | null
}

// Helpers
const formatBlockType = (type: string): string => {
  const labels: Record<string, string> = {
    independent_spring: "Незалежний пружинний",
    bonnel_spring: "Bonnel",
    springless: "Безпружинний",
  }
  return labels[type] || type
}

const formatPrice = (variants: Mattress["variants"]): string => {
  if (!variants?.length) return "—"
  
  const prices = variants
    .flatMap(v => v.prices || [])
    .filter(p => p.currency_code === "uah")
    .map(p => p.amount)
  
  if (prices.length === 0) return "—"
  
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  
  if (min === max) return `${min.toLocaleString()} грн`
  return `${min.toLocaleString()} - ${max.toLocaleString()} грн`
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit", 
    year: "numeric",
  })
}

/**
 * Список матраців
 * URL: /app/mattresses
 */
const MattressesPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const prompt = usePrompt()

  // Запит на отримання списку матраців
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mattresses"],
    queryFn: async () => {
      const response = await fetch("/admin/mattresses", {
        credentials: "include",
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to fetch mattresses")
      }
      
      return response.json()
    },
  })

  // Мутація для видалення
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/mattresses/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to delete mattress")
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", { description: "Матрац видалено" })
      queryClient.invalidateQueries({ queryKey: ["mattresses"] })
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  const mattresses: Mattress[] = data?.mattresses || []

  // Видалення матраца
  const handleDelete = async (id: string, title: string) => {
    const confirmed = await prompt({
      title: "Видалити матрац?",
      description: `Ви впевнені що хочете видалити "${title}"? Цю дію неможливо скасувати.`,
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
            <Heading level="h1">Матраци</Heading>
            <Text className="text-gray-500">
              {isLoading ? "Завантаження..." : `${mattresses.length} товарів`}
            </Text>
          </div>
          <Button 
            variant="primary" 
            onClick={() => navigate("/mattresses/create")}
          >
            <PlusMini className="mr-2" />
            Додати матрац
          </Button>
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
          ) : mattresses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛏️</div>
              <Heading level="h2" className="mb-2">Матраців поки немає</Heading>
              <Text className="text-gray-500 mb-6">
                Створіть перший матрац для вашого магазину
              </Text>
              <Button 
                variant="primary"
                onClick={() => navigate("/mattresses/create")}
              >
                <PlusMini className="mr-2" />
                Додати матрац
              </Button>
            </div>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell className="w-12"></Table.HeaderCell>
                  <Table.HeaderCell>Назва</Table.HeaderCell>
                  <Table.HeaderCell>Характеристики</Table.HeaderCell>
                  <Table.HeaderCell>Ціна</Table.HeaderCell>
                  <Table.HeaderCell>Розмірів</Table.HeaderCell>
                  <Table.HeaderCell>Статус</Table.HeaderCell>
                  <Table.HeaderCell>Дата</Table.HeaderCell>
                  <Table.HeaderCell className="w-12"></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {mattresses.map((mattress) => (
                  <Table.Row 
                    key={mattress.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/products/${mattress.id}`)}
                  >
                    {/* Thumbnail */}
                    <Table.Cell>
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                        {mattress.thumbnail ? (
                          <img 
                            src={mattress.thumbnail} 
                            alt={mattress.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            🛏️
                          </div>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Назва */}
                    <Table.Cell>
                      <div>
                        <Text className="font-medium">{mattress.title}</Text>
                        <Text className="text-xs text-gray-500">{mattress.handle}</Text>
                      </div>
                    </Table.Cell>

                    {/* Характеристики */}
                    <Table.Cell>
                      {mattress.mattress_attributes ? (
                        <div className="flex flex-wrap gap-1">
                          <Badge color="grey" className="text-xs">
                            {mattress.mattress_attributes.height} см
                          </Badge>
                          <Badge color="grey" className="text-xs">
                            {mattress.mattress_attributes.hardness}
                          </Badge>
                          <Badge color="grey" className="text-xs">
                            {formatBlockType(mattress.mattress_attributes.block_type)}
                          </Badge>
                        </div>
                      ) : (
                        <Text className="text-gray-400">—</Text>
                      )}
                    </Table.Cell>

                    {/* Ціна */}
                    <Table.Cell>
                      <Text>{formatPrice(mattress.variants)}</Text>
                    </Table.Cell>

                    {/* Кількість розмірів */}
                    <Table.Cell>
                      <Badge color="blue">
                        {mattress.variants?.length || 0}
                      </Badge>
                    </Table.Cell>

                    {/* Статус */}
                    <Table.Cell>
                      <div className="flex gap-1">
                        <Badge color={mattress.status === "published" ? "green" : "grey"}>
                          {mattress.status === "published" ? "Активний" : "Чернетка"}
                        </Badge>
                        {mattress.mattress_attributes?.is_new && (
                          <Badge color="orange">NEW</Badge>
                        )}
                        {(mattress.mattress_attributes?.discount_percent ?? 0) > 0 && (
                          <Badge color="red">
                            -{mattress.mattress_attributes?.discount_percent}%
                          </Badge>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Дата */}
                    <Table.Cell>
                      <Text className="text-gray-500 text-sm">
                        {formatDate(mattress.created_at)}
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
                            onClick={() => navigate(`/products/${mattress.id}`)}
                          >
                            <Eye className="mr-2" />
                            Переглянути
                          </DropdownMenu.Item>
                          <DropdownMenu.Item 
                            onClick={() => navigate(`/mattresses/${mattress.id}/edit`)}
                          >
                            <PencilSquare className="mr-2" />
                            Редагувати
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item 
                            onClick={() => handleDelete(mattress.id, mattress.title)}
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
  label: "Матраци",
})

export default MattressesPage
