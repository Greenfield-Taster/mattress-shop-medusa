import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { 
  Container, 
  Heading, 
  Button, 
  Input, 
  Label, 
  Select,
  Badge,
  Text,
  Switch,
  toast,
  Toaster,
} from "@medusajs/ui"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useState, useEffect } from "react"

// Константи
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

interface MattressAttributes {
  id: string
  height: number
  hardness: string
  block_type: string
  cover_type: string
  max_weight: number
  fillers: string[]
  description_main: string | null
  description_care: string | null
  specs: string[]
  is_new: boolean
  discount_percent: number
}

/**
 * Widget для відображення та редагування атрибутів матраца
 * на сторінці деталей продукту
 */
const MattressAttributesWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [attributes, setAttributes] = useState<MattressAttributes | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Форма редагування
  const [height, setHeight] = useState(20)
  const [hardness, setHardness] = useState("H3")
  const [blockType, setBlockType] = useState("independent_spring")
  const [coverType, setCoverType] = useState("removable")
  const [maxWeight, setMaxWeight] = useState(120)
  const [selectedFillers, setSelectedFillers] = useState<string[]>([])
  const [isNew, setIsNew] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)

  // Завантаження атрибутів
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const response = await fetch(
          `/admin/products/${data.id}?fields=+mattress_attributes.*`,
          { credentials: "include" }
        )
        
        if (response.ok) {
          const result = await response.json()
          const attrs = result.product?.mattress_attributes
          
          if (attrs) {
            setAttributes(attrs)
            // Заповнюємо форму
            setHeight(attrs.height || 20)
            setHardness(attrs.hardness || "H3")
            setBlockType(attrs.block_type || "independent_spring")
            setCoverType(attrs.cover_type || "removable")
            setMaxWeight(attrs.max_weight || 120)
            setSelectedFillers(attrs.fillers || [])
            setIsNew(attrs.is_new || false)
            setDiscountPercent(attrs.discount_percent || 0)
          }
        }
      } catch (error) {
        console.error("Failed to fetch mattress attributes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttributes()
  }, [data.id])

  // Toggle filler
  const toggleFiller = (filler: string) => {
    setSelectedFillers(prev => 
      prev.includes(filler) 
        ? prev.filter(f => f !== filler)
        : [...prev, filler]
    )
  }

  // Зберегти зміни
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // TODO: Implement update API
      // const response = await fetch(`/admin/mattresses/${data.id}/attributes`, {
      //   method: "PUT",
      //   credentials: "include",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     height,
      //     hardness,
      //     block_type: blockType,
      //     cover_type: coverType,
      //     max_weight: maxWeight,
      //     fillers: selectedFillers,
      //     is_new: isNew,
      //     discount_percent: discountPercent,
      //   }),
      // })

      toast.success("Збережено", {
        description: "Атрибути матраца оновлено",
      })
      
      setIsEditing(false)
    } catch (error: any) {
      toast.error("Помилка", {
        description: error.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Скасувати редагування
  const handleCancel = () => {
    if (attributes) {
      setHeight(attributes.height)
      setHardness(attributes.hardness)
      setBlockType(attributes.block_type)
      setCoverType(attributes.cover_type)
      setMaxWeight(attributes.max_weight)
      setSelectedFillers(attributes.fillers || [])
      setIsNew(attributes.is_new)
      setDiscountPercent(attributes.discount_percent)
    }
    setIsEditing(false)
  }

  // Якщо завантажується
  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4 text-center text-gray-500">
          Завантаження...
        </div>
      </Container>
    )
  }

  // Якщо немає атрибутів матраца
  if (!attributes) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Heading level="h2">Атрибути матраца</Heading>
          </div>
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <Text className="text-gray-500 mb-2">
              Цей продукт не має атрибутів матраца
            </Text>
            <Text className="text-xs text-gray-400">
              Атрибути додаються при створенні через сторінку "Матраци"
            </Text>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Heading level="h2">Атрибути матраца</Heading>
          {isNew && <Badge color="orange">NEW</Badge>}
          {discountPercent > 0 && <Badge color="red">-{discountPercent}%</Badge>}
        </div>
        {!isEditing ? (
          <Button variant="secondary" size="small" onClick={() => setIsEditing(true)}>
            Редагувати
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" size="small" onClick={handleCancel} disabled={isSaving}>
              Скасувати
            </Button>
            <Button variant="primary" size="small" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {isEditing ? (
          // Режим редагування
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Висота (см)</Label>
                <Input
                  type="number"
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
                <Label>Макс. вага (кг)</Label>
                <Input
                  type="number"
                  value={maxWeight}
                  onChange={(e) => setMaxWeight(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={isNew} onCheckedChange={setIsNew} />
                  <Label>Новинка</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Знижка %</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Наповнювачі</Label>
              <div className="flex flex-wrap gap-2">
                {FILLER_OPTIONS.map(filler => (
                  <Badge
                    key={filler.value}
                    color={selectedFillers.includes(filler.value) ? "blue" : "grey"}
                    className="cursor-pointer"
                    onClick={() => toggleFiller(filler.value)}
                  >
                    {selectedFillers.includes(filler.value) ? "✓ " : ""}{filler.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Режим перегляду
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Text className="text-xs text-gray-500">Висота</Text>
              <Text className="font-medium">{attributes.height} см</Text>
            </div>
            <div>
              <Text className="text-xs text-gray-500">Жорсткість</Text>
              <Text className="font-medium">
                {HARDNESS_OPTIONS.find(h => h.value === attributes.hardness)?.label || attributes.hardness}
              </Text>
            </div>
            <div>
              <Text className="text-xs text-gray-500">Тип блоку</Text>
              <Text className="font-medium">
                {BLOCK_TYPE_OPTIONS.find(b => b.value === attributes.block_type)?.label || attributes.block_type}
              </Text>
            </div>
            <div>
              <Text className="text-xs text-gray-500">Макс. навантаження</Text>
              <Text className="font-medium">{attributes.max_weight} кг</Text>
            </div>
            <div>
              <Text className="text-xs text-gray-500">Чохол</Text>
              <Text className="font-medium">
                {COVER_TYPE_OPTIONS.find(c => c.value === attributes.cover_type)?.label || attributes.cover_type}
              </Text>
            </div>
            <div className="col-span-2 md:col-span-3">
              <Text className="text-xs text-gray-500 mb-1">Наповнювачі</Text>
              <div className="flex flex-wrap gap-1">
                {(attributes.fillers || []).map(filler => (
                  <Badge key={filler} color="blue" className="text-xs">
                    {FILLER_OPTIONS.find(f => f.value === filler)?.label || filler}
                  </Badge>
                ))}
                {(!attributes.fillers || attributes.fillers.length === 0) && (
                  <Text className="text-gray-400">Не вказано</Text>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

// Конфігурація widget - показуємо на сторінці деталей продукту
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default MattressAttributesWidget
