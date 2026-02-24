import {
  Container,
  Heading,
  Button,
  Input,
  Label,
  Select,
  Switch,
  Text,
  toast,
  Toaster,
} from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { ArrowLeft } from "@medusajs/icons"

const CreatePromoCodePage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [minOrderAmount, setMinOrderAmount] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [isActive, setIsActive] = useState(true)

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/admin/promo-codes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to create promo code")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", { description: "Промокод створено" })
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
      navigate("/promo-codes")
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (code.trim().length !== 6) {
      toast.error("Помилка", { description: "Код промокоду має містити рівно 6 символів" })
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

    createMutation.mutate(data)
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Toaster />

      <Container className="divide-y p-0">
        <div className="flex items-center gap-x-4 px-6 py-4">
          <Button variant="transparent" onClick={() => navigate("/promo-codes")}>
            <ArrowLeft />
          </Button>
          <div>
            <Heading level="h1">Новий промокод</Heading>
            <Text className="text-gray-500">Створення нового промокоду</Text>
          </div>
        </div>
      </Container>

      <Container className="divide-y p-0">
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="code">Код промокоду *</Label>
              <Input
                id="code"
                placeholder="SAVE10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                maxLength={6}
                className="mt-1 font-mono"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Рівно 6 символів (латиниця та цифри)
              </Text>
            </div>

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
              <Text className="text-xs text-gray-500 mt-1">
                0 = без обмежень
              </Text>
            </div>

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
              <Text className="text-xs text-gray-500 mt-1">
                0 = необмежено
              </Text>
            </div>

            <div>
              <Label htmlFor="startsAt">Дата початку</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Пусто = одразу активний
              </Text>
            </div>

            <div>
              <Label htmlFor="expiresAt">Дата закінчення</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Пусто = безстроковий
              </Text>
            </div>

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
              isLoading={createMutation.isPending}
            >
              Створити промокод
            </Button>
          </div>
        </form>
      </Container>
    </div>
  )
}

export default CreatePromoCodePage
