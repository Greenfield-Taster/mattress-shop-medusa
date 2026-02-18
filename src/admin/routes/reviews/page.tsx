import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Table,
  Badge,
  Text,
  Select,
  DropdownMenu,
  IconButton,
  toast,
  Toaster,
  usePrompt,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  EllipsisHorizontal,
  CheckCircleSolid,
  XCircleSolid,
  Trash,
} from "@medusajs/icons"
import { useState } from "react"

interface Review {
  id: string
  product_id: string
  customer_id: string | null
  name: string
  email: string
  rating: number
  comment: string
  is_verified_purchase: boolean
  status: "pending" | "approved" | "rejected"
  created_at: string
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge color="green">Схвалено</Badge>
    case "rejected":
      return <Badge color="red">Відхилено</Badge>
    default:
      return <Badge color="orange">На модерації</Badge>
  }
}

const renderStars = (rating: number) => {
  return "★".repeat(rating) + "☆".repeat(5 - rating)
}

const ReviewsPage = () => {
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  const [filterStatus, setFilterStatus] = useState<string>("")

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reviews", filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterStatus) params.set("status", filterStatus)
      params.set("limit", "100")

      const response = await fetch(`/admin/reviews?${params.toString()}`, {
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to fetch reviews")
      }

      return response.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/admin/reviews/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to update review")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", { description: "Статус відгуку змінено" })
      queryClient.invalidateQueries({ queryKey: ["reviews"] })
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to delete review")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", { description: "Відгук видалено" })
      queryClient.invalidateQueries({ queryKey: ["reviews"] })
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await prompt({
      title: "Видалити відгук?",
      description: `Ви впевнені що хочете видалити відгук від "${name}"? Цю дію неможливо скасувати.`,
      confirmText: "Видалити",
      cancelText: "Скасувати",
    })

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const reviews: Review[] = data?.reviews || []
  const pendingCount = reviews.filter((r) => r.status === "pending").length

  return (
    <div className="flex flex-col gap-y-4">
      <Toaster />

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Відгуки</Heading>
            <Text className="text-gray-500">
              {isLoading
                ? "Завантаження..."
                : `${reviews.length} відгуків${pendingCount > 0 ? ` (${pendingCount} на модерації)` : ""}`}
            </Text>
          </div>
        </div>
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4 flex items-center gap-4">
          <Select
            value={filterStatus || "all"}
            onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}
          >
            <Select.Trigger className="w-48">
              <Select.Value placeholder="Всі статуси" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">Всі статуси</Select.Item>
              <Select.Item value="pending">На модерації</Select.Item>
              <Select.Item value="approved">Схвалені</Select.Item>
              <Select.Item value="rejected">Відхилені</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </Container>

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
              <button onClick={() => refetch()}>Спробувати знову</button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <Heading level="h2" className="mb-2">
                Відгуків поки немає
              </Heading>
              <Text className="text-gray-500">
                Відгуки з'являться тут після того, як клієнти залишать їх на сайті
              </Text>
            </div>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Автор</Table.HeaderCell>
                  <Table.HeaderCell>Оцінка</Table.HeaderCell>
                  <Table.HeaderCell>Відгук</Table.HeaderCell>
                  <Table.HeaderCell>Продукт ID</Table.HeaderCell>
                  <Table.HeaderCell>Статус</Table.HeaderCell>
                  <Table.HeaderCell>Дата</Table.HeaderCell>
                  <Table.HeaderCell className="w-12"></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {reviews.map((review) => (
                  <Table.Row key={review.id}>
                    <Table.Cell>
                      <div>
                        <Text className="font-semibold">{review.name}</Text>
                        <Text className="text-xs text-gray-500">{review.email}</Text>
                        {review.is_verified_purchase && (
                          <Badge color="green" className="mt-1">Покупець</Badge>
                        )}
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <Text className="text-yellow-500 text-lg">
                        {renderStars(review.rating)}
                      </Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Text className="max-w-xs truncate" title={review.comment}>
                        {review.comment.length > 80
                          ? review.comment.substring(0, 80) + "..."
                          : review.comment}
                      </Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Text className="text-xs text-gray-500 font-mono">
                        {review.product_id.substring(0, 12)}...
                      </Text>
                    </Table.Cell>

                    <Table.Cell>{getStatusBadge(review.status)}</Table.Cell>

                    <Table.Cell>
                      <Text className="text-gray-500 text-sm">
                        {formatDate(review.created_at)}
                      </Text>
                    </Table.Cell>

                    <Table.Cell>
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <IconButton variant="transparent">
                            <EllipsisHorizontal />
                          </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                          {review.status !== "approved" && (
                            <DropdownMenu.Item
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: review.id,
                                  status: "approved",
                                })
                              }
                            >
                              <CheckCircleSolid className="mr-2 text-green-500" />
                              Схвалити
                            </DropdownMenu.Item>
                          )}
                          {review.status !== "rejected" && (
                            <DropdownMenu.Item
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: review.id,
                                  status: "rejected",
                                })
                              }
                            >
                              <XCircleSolid className="mr-2 text-red-500" />
                              Відхилити
                            </DropdownMenu.Item>
                          )}
                          {review.status !== "pending" && (
                            <DropdownMenu.Item
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: review.id,
                                  status: "pending",
                                })
                              }
                            >
                              Повернути на модерацію
                            </DropdownMenu.Item>
                          )}
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            onClick={() => handleDelete(review.id, review.name)}
                            className="text-red-500"
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

export const config = defineRouteConfig({
  label: "Відгуки",
})

export default ReviewsPage
