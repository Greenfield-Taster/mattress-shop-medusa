import {
  Container,
  Heading,
  Button,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Badge,
  toast,
  Toaster,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft } from "@medusajs/icons"

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

// Конвертація дати для input datetime-local
const formatDateForInput = (date: string | null): string => {
  if (!date) return ""
  const d = new Date(date)
  const offset = d.getTimezoneOffset()
  const localDate = new Date(d.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

/**
 * Форма редагування промокоду
 * URL: /app/promo-codes/:id/edit
 */
const EditPromoCodePage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  // Стан форми
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [minOrderAmount, setMinOrderAmount] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Запит на отримання промокоду
  const { data, isLoading, error } = useQuery({
    queryKey: ["promo-code", id],
    queryFn: async () => {
      const response = await fetch(`/admin/promo-codes/${id}`, {
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to fetch promo code")
      }

      return response.json()
    },
    enabled: !!id,
  })

  const promoCode: PromoCode | undefined = data?.promo_code

  // Заповнюємо форму даними з API
  useEffect(() => {
    if (promoCode) {
      setCode(promoCode.code)
      setDescription(promoCode.description || "")
      setDiscountType(promoCode.discount_type)
      setDiscountValue(
        promoCode.discount_type === "percentage"
          ? String(promoCode.discount_value)
          : String(promoCode.discount_value / 100)
      )
      setMinOrderAmount(
        promoCode.min_order_amount > 0 ? String(promoCode.min_order_amount / 100) : ""
      )
      setMaxUses(promoCode.max_uses > 0 ? String(promoCode.max_uses) : "")
      setStartsAt(formatDateForInput(promoCode.starts_at))
      setExpiresAt(formatDateForInput(promoCode.expires_at))
      setIsActive(promoCode.is_active)
    }
  }, [promoCode])

  // Мутація для оновлення
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/admin/promo-codes/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to update promo code")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", { description: "Промокод оновлено" })
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
      queryClient.invalidateQueries({ queryKey: ["promo-code", id] })
      navigate("/promo-codes")
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Валідація
    if (!code.trim()) {
      toast.error("Помилка", { description: "Введіть код промокоду" })
      return
    }

    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error("Помилка", { description: "Введіть значення знижки" })
      return
    }

    const discountValueNum = parseFloat(discountValue)

    if (discountType === "percentage" && discountValueNum > 100) {
      toast.error("Помилка", { description: "Відсоток не може перевищувати 100" })
      return
    }

    // Формуємо дані
    const data = {
      code: code.toUpperCase().trim(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value:
        discountType === "percentage"
          ? discountValueNum
          : Math.round(discountValueNum * 100),
      min_order_amount: minOrderAmount
        ? Math.round(parseFloat(minOrderAmount) * 100)
        : 0,
      max_uses: maxUses ? parseInt(maxUses) : 0,
      starts_at: startsAt || null,
      expires_at: expiresAt || null,
      is_active: isActive,
    }

    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <Container className="p-6">
        <div className="animate-pulse">Завантаження...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="p-6">
        <Text className="text-red-500">
          Помилка: {(error as Error).message}
        </Text>
        <Button variant="secondary" onClick={() => navigate("/promo-codes")} className="mt-4">
          Повернутися
        </Button>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Toaster />

      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-x-4">
            <Button variant="transparent" onClick={() => navigate("/promo-codes")}>
              <ArrowLeft />
            </Button>
            <div>
              <Heading level="h1">Редагування промокоду</Heading>
              <div className="flex items-center gap-x-2 mt-1">
                <Text className="font-mono font-bold">{promoCode?.code}</Text>
                {promoCode && (
                  <Badge color="grey">
                    Використано: {promoCode.current_uses}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Form */}
      <Container className="divide-y p-0">
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Код */}
            <div>
              <Label htmlFor="code">Код промокоду *</Label>
              <Input
                id="code"
                placeholder="SAVE10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 font-mono"
              />
            </div>

            {/* Опис */}
            <div>
              <Label htmlFor="description">Опис</Label>
              <Input
                id="description"
                placeholder="Знижка для нових клієнтів"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Тип знижки */}
            <div>
              <Label htmlFor="discountType">Тип знижки *</Label>
              <Select
                value={discountType}
                onValueChange={(value) => setDiscountType(value as "percentage" | "fixed")}
              >
                <Select.Trigger className="mt-1">
                  <Select.Value placeholder="Оберіть тип" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="percentage">Відсоток (%)</Select.Item>
                  <Select.Item value="fixed">Фіксована сума (грн)</Select.Item>
                </Select.Content>
              </Select>
            </div>

            {/* Значення знижки */}
            <div>
              <Label htmlFor="discountValue">
                {discountType === "percentage" ? "Відсоток знижки *" : "Сума знижки (грн) *"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                step={discountType === "percentage" ? "1" : "0.01"}
                placeholder={discountType === "percentage" ? "10" : "100"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Мінімальна сума */}
            <div>
              <Label htmlFor="minOrderAmount">Мінімальна сума замовлення (грн)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="mt-1"
              />
              <Text className="text-xs text-gray-500 mt-1">0 = без обмежень</Text>
            </div>

            {/* Ліміт використань */}
            <div>
              <Label htmlFor="maxUses">Максимум використань</Label>
              <Input
                id="maxUses"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="mt-1"
              />
              <Text className="text-xs text-gray-500 mt-1">0 = необмежено</Text>
            </div>

            {/* Дата початку */}
            <div>
              <Label htmlFor="startsAt">Дата початку</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Дата закінчення */}
            <div>
              <Label htmlFor="expiresAt">Дата закінчення</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Активний */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-x-3">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Активний промокод</Label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-x-3 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/promo-codes")}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
            >
              Зберегти зміни
            </Button>
          </div>
        </form>
      </Container>
    </div>
  )
}

export default EditPromoCodePage
