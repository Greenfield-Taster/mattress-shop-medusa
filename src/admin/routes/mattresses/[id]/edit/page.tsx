import { 
  Container, 
  Heading, 
  Button, 
  Input, 
  Label, 
  Select,
  Textarea,
  Switch,
  Badge,
  Text,
  toast,
  Toaster,
} from "@medusajs/ui"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft } from "@medusajs/icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ===== КОНСТАНТИ =====

const HARDNESS_OPTIONS = [
  { value: "H1", label: "H1 (м'який)" },
  { value: "H2", label: "H2 (нижче середньої)" },
  { value: "H3", label: "H3 (середня)" },
  { value: "H4", label: "H4 (жорсткий)" },
]

const BLOCK_TYPE_OPTIONS = [
  { value: "independent_spring", label: "Незалежний пружинний блок" },
  { value: "bonnel_spring", label: "Залежний пружинний блок (Bonnel)" },
  { value: "springless", label: "Безпружинний" },
]

const COVER_TYPE_OPTIONS = [
  { value: "removable", label: "Знімний" },
  { value: "non_removable", label: "Незнімний" },
]

const FILLER_OPTIONS = [
  { value: "latex", label: "Латекс" },
  { value: "memory_foam", label: "Піна з пам'яттю" },
  { value: "coconut", label: "Кокосове волокно" },
  { value: "latex_foam", label: "Латексована піна" },
  { value: "felt", label: "Войлок" },
  { value: "polyurethane", label: "Пінополіуретан" },
]

const STATUS_OPTIONS = [
  { value: "published", label: "Активний" },
  { value: "draft", label: "Чернетка" },
]

// Типи
interface VariantPrice {
  id: string
  title: string
  price: number
}

// ===== КОМПОНЕНТ =====

const EditMattressPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Стан форми - основні
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState("published")
  
  // Стан форми - атрибути
  const [height, setHeight] = useState(20)
  const [hardness, setHardness] = useState("H3")
  const [blockType, setBlockType] = useState("independent_spring")
  const [coverType, setCoverType] = useState("removable")
  const [maxWeight, setMaxWeight] = useState(120)
  const [selectedFillers, setSelectedFillers] = useState<string[]>([])
  const [isNew, setIsNew] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [descriptionMain, setDescriptionMain] = useState("")
  const [descriptionCare, setDescriptionCare] = useState("")

  // Стан форми - ціни варіантів
  const [variantPrices, setVariantPrices] = useState<VariantPrice[]>([])

  // Завантаження даних матраца
  const { data, isLoading, error } = useQuery({
    queryKey: ["mattress", id],
    queryFn: async () => {
      const response = await fetch(`/admin/mattresses/${id}`, {
        credentials: "include",
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch mattress")
      }
      
      return response.json()
    },
    enabled: !!id,
  })

  // Заповнення форми даними
  useEffect(() => {
    if (data?.mattress) {
      const m = data.mattress
      setTitle(m.title || "")
      setStatus(m.status || "published")
      
      // Атрибути матраца
      if (m.mattress_attributes) {
        setHeight(m.mattress_attributes.height || 20)
        setHardness(m.mattress_attributes.hardness || "H3")
        setBlockType(m.mattress_attributes.block_type || "independent_spring")
        setCoverType(m.mattress_attributes.cover_type || "removable")
        setMaxWeight(m.mattress_attributes.max_weight || 120)
        setSelectedFillers(m.mattress_attributes.fillers || [])
        setIsNew(m.mattress_attributes.is_new || false)
        setDiscountPercent(m.mattress_attributes.discount_percent || 0)
        setDescriptionMain(m.mattress_attributes.description_main || "")
        setDescriptionCare(m.mattress_attributes.description_care || "")
      }

      // Ціни варіантів
      if (m.variants) {
        const prices = m.variants.map((v: any) => ({
          id: v.id,
          title: v.title,
          price: v.prices?.find((p: any) => p.currency_code === "uah")?.amount || 0,
        }))
        setVariantPrices(prices)
      }
    }
  }, [data])

  // Мутація для оновлення
  const updateMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch(`/admin/mattresses/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to update mattress")
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", { description: "Матрац оновлено" })
      queryClient.invalidateQueries({ queryKey: ["mattresses"] })
      queryClient.invalidateQueries({ queryKey: ["mattress", id] })
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  // Toggle filler
  const toggleFiller = (filler: string) => {
    setSelectedFillers(prev => 
      prev.includes(filler) 
        ? prev.filter(f => f !== filler)
        : [...prev, filler]
    )
  }

  // Оновлення ціни варіанту
  const updateVariantPrice = (variantId: string, price: number) => {
    setVariantPrices(prev => 
      prev.map(vp => vp.id === variantId ? { ...vp, price } : vp)
    )
  }

  // Збереження
  const handleSave = () => {
    updateMutation.mutate({
      title,
      status,
      height,
      hardness,
      block_type: blockType,
      cover_type: coverType,
      max_weight: maxWeight,
      fillers: selectedFillers,
      is_new: isNew,
      discount_percent: discountPercent,
      description_main: descriptionMain,
      description_care: descriptionCare,
      variants: variantPrices.map(vp => ({
        id: vp.id,
        price: vp.price,
      })),
    })
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
        <Text className="text-red-500">Помилка завантаження: {(error as Error).message}</Text>
        <Button variant="secondary" onClick={() => navigate("/mattresses")} className="mt-4">
          Назад до списку
        </Button>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <Toaster />
      
      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-x-4">
            <Button variant="transparent" onClick={() => navigate("/mattresses")}>
              <ArrowLeft />
            </Button>
            <div>
              <Heading level="h1">Редагувати матрац</Heading>
              <Text className="text-gray-500">{data?.mattress?.handle}</Text>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/mattresses")}>
              Скасувати
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        </div>
      </Container>

      {/* Основна інформація */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Основна інформація</Heading>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Назва матраца</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Статус</Label>
              <Select value={status} onValueChange={setStatus}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {STATUS_OPTIONS.map(opt => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-x-6 mt-4">
            <div className="flex items-center gap-x-2">
              <Switch checked={isNew} onCheckedChange={setIsNew} />
              <Label>Новинка</Label>
            </div>
            <div className="flex items-center gap-x-2">
              <Label>Знижка %</Label>
              <Input
                type="number"
                className="w-20"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Характеристики */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Характеристики</Heading>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label>Висота (см)</Label>
              <Input
                type="number"
                min={3}
                max={40}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
            
            <div>
              <Label>Жорсткість</Label>
              <Select value={hardness} onValueChange={setHardness}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {HARDNESS_OPTIONS.map(opt => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div>
              <Label>Тип блоку</Label>
              <Select value={blockType} onValueChange={setBlockType}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {BLOCK_TYPE_OPTIONS.map(opt => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div>
              <Label>Чохол</Label>
              <Select value={coverType} onValueChange={setCoverType}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {COVER_TYPE_OPTIONS.map(opt => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div>
              <Label>Макс. вага (кг)</Label>
              <Input
                type="number"
                min={50}
                max={200}
                value={maxWeight}
                onChange={(e) => setMaxWeight(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Наповнювачі */}
          <div className="mt-6">
            <Label className="mb-2 block">Наповнювачі</Label>
            <div className="flex flex-wrap gap-2">
              {FILLER_OPTIONS.map(filler => (
                <Badge
                  key={filler.value}
                  color={selectedFillers.includes(filler.value) ? "blue" : "grey"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleFiller(filler.value)}
                >
                  {selectedFillers.includes(filler.value) ? "✓ " : ""}{filler.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Container>

      {/* Ціни варіантів */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Розміри та ціни</Heading>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {variantPrices.map(vp => (
              <div key={vp.id} className="border rounded-lg p-3">
                <Label className="font-medium mb-2 block">{vp.title}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={vp.price || ""}
                    onChange={(e) => updateVariantPrice(vp.id, Number(e.target.value))}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    грн
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {variantPrices.length === 0 && (
            <Text className="text-gray-500">Немає варіантів для редагування</Text>
          )}
        </div>
      </Container>

      {/* Опис */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Опис</Heading>
          
          <div className="space-y-4">
            <div>
              <Label>Основний опис</Label>
              <Textarea
                rows={5}
                value={descriptionMain}
                onChange={(e) => setDescriptionMain(e.target.value)}
              />
            </div>

            <div>
              <Label>Рекомендації по догляду</Label>
              <Textarea
                rows={4}
                value={descriptionCare}
                onChange={(e) => setDescriptionCare(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Footer Actions (sticky) */}
      <Container className="p-0 sticky bottom-0 bg-white border-t shadow-lg">
        <div className="flex items-center justify-end px-6 py-4 gap-2">
          <Button 
            variant="secondary" 
            onClick={() => navigate("/mattresses")}
            disabled={updateMutation.isPending}
          >
            Скасувати
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Збереження..." : "Зберегти зміни"}
          </Button>
        </div>
      </Container>
    </div>
  )
}

export default EditMattressPage
