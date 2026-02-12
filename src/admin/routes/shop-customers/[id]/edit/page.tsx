import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Input,
  Label,
  Button,
  Switch,
  toast,
  Toaster,
  Textarea,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft } from "@medusajs/icons"

interface ShopCustomer {
  id: string
  phone: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  google_id: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  is_active: boolean
}

const EditCustomerPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    is_active: true,
  })

  // Fetch customer data
  const { data, isLoading, error } = useQuery({
    queryKey: ["shop-customer", id],
    queryFn: async () => {
      const response = await fetch(`/admin/shop-customers/${id}`, {
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to fetch customer")
      }

      return response.json()
    },
    enabled: !!id,
  })

  // Update form when data loads
  useEffect(() => {
    if (data?.customer) {
      const c = data.customer as ShopCustomer
      setFormData({
        first_name: c.first_name || "",
        last_name: c.last_name || "",
        email: c.email || "",
        phone: c.phone || "",
        is_active: c.is_active,
      })
    }
  }, [data])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<FormData>) => {
      const response = await fetch(`/admin/shop-customers/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to update customer")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", {
        description: "Дані користувача оновлено",
      })
      queryClient.invalidateQueries({ queryKey: ["shop-customers"] })
      queryClient.invalidateQueries({ queryKey: ["shop-customer", id] })
      navigate("/shop-customers")
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const customer = data?.customer as ShopCustomer | undefined

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-gray-500">Завантаження...</div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <Container className="p-6">
        <div className="text-center py-12">
          <Text className="text-red-500 mb-4">
            {error ? (error as Error).message : "Користувача не знайдено"}
          </Text>
          <Button variant="secondary" onClick={() => navigate("/shop-customers")}>
            <ArrowLeft className="mr-2" />
            Назад до списку
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Toaster />

      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="transparent" onClick={() => navigate("/shop-customers")}>
              <ArrowLeft />
            </Button>
            <div>
              <Heading level="h1">Редагування користувача</Heading>
              <Text className="text-gray-500">
                {customer.first_name || customer.last_name
                  ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
                  : customer.email || customer.phone || "Без імені"}
              </Text>
            </div>
          </div>
        </div>
      </Container>

      {/* Form */}
      <Container className="divide-y p-0">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-6">
            {/* Avatar placeholder */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                  👤
                </div>
              </div>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Ім'я</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  placeholder="Введіть ім'я"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Прізвище</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  placeholder="Введіть прізвище"
                />
              </div>
            </div>

            {/* Contact fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+380..."
                />
                {customer.google_id && (
                  <Text className="text-xs text-gray-500 mt-1">
                    Обережно: користувач входить через Google
                  </Text>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between py-4 border-t border-b">
              <div>
                <Text className="font-medium">Статус акаунту</Text>
                <Text className="text-sm text-gray-500">
                  {formData.is_active
                    ? "Користувач може входити в систему"
                    : "Користувач заблокований"}
                </Text>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
            </div>

            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <Text className="text-sm text-gray-500">
                <strong>ID:</strong> {customer.id}
              </Text>
              <Text className="text-sm text-gray-500">
                <strong>Метод входу:</strong> {customer.google_id ? "Google" : "SMS"}
              </Text>
              <Text className="text-sm text-gray-500">
                <strong>Дата реєстрації:</strong>{" "}
                {new Date(customer.created_at).toLocaleString("uk-UA")}
              </Text>
              {customer.last_login_at && (
                <Text className="text-sm text-gray-500">
                  <strong>Останній вхід:</strong>{" "}
                  {new Date(customer.last_login_at).toLocaleString("uk-UA")}
                </Text>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/shop-customers")}
              >
                Скасувати
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Збереження..." : "Зберегти"}
              </Button>
            </div>
          </div>
        </form>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Редагування користувача",
})

export default EditCustomerPage
