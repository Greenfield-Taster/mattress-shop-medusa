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
} from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { ArrowLeft } from "@medusajs/icons"

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

const MATTRESS_SIZES = [
  { size: "60×120", category: "Дитячий" },
  { size: "70×140", category: "Дитячий" },
  { size: "70×160", category: "Дитячий" },
  { size: "80×190", category: "Односпальний" },
  { size: "80×200", category: "Односпальний" },
  { size: "90×190", category: "Односпальний" },
  { size: "90×200", category: "Односпальний" },
  { size: "120×190", category: "Полуторний" },
  { size: "120×200", category: "Полуторний" },
  { size: "140×190", category: "Двоспальний" },
  { size: "140×200", category: "Двоспальний" },
  { size: "160×190", category: "Двоспальний" },
  { size: "160×200", category: "Двоспальний" },
  { size: "180×190", category: "King Size" },
  { size: "180×200", category: "King Size" },
  { size: "200×200", category: "King Size XL" },
]

// ===== ШАБЛОНИ =====

const DESCRIPTION_TEMPLATES = {
  independent_spring: `Матрац оптимальної жорсткості з ортопедичним ефектом. Основу моделі складає незалежний пружинний блок «Pocket Spring», який забезпечує індивідуальну підтримку кожної точки тіла.`,
  bonnel_spring: `Класичний пружинний матрац з блоком Bonnel. Надійна конструкція забезпечує рівномірну підтримку тіла під час сну.`,
  springless: `Безпружинний матрац з сучасних матеріалів. Відсутність металевих елементів забезпечує безшумність та довговічність.`,
}

const CARE_TEMPLATE = `Виконувати глибоку чистку дозволяється тільки клінінговій компанії або хімчистці. Не варто застосовувати засоби зі змістом хлору. Рекомендується провітрювати матрац кожні 2-3 місяці.`

// ===== ТИПИ =====

interface SizePrice {
  size: string
  price: number
  enabled: boolean
}

// ===== КОМПОНЕНТ =====

const CreateMattressPage = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Основні дані
  const [title, setTitle] = useState("")
  const [handle, setHandle] = useState("")
  
  // Характеристики
  const [height, setHeight] = useState(20)
  const [hardness, setHardness] = useState("H3")
  const [blockType, setBlockType] = useState("independent_spring")
  const [coverType, setCoverType] = useState("removable")
  const [maxWeight, setMaxWeight] = useState(120)
  const [selectedFillers, setSelectedFillers] = useState<string[]>([])
  
  // Прапорці
  const [isNew, setIsNew] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)

  // Опис (з шаблонів)
  const [descriptionMain, setDescriptionMain] = useState(DESCRIPTION_TEMPLATES.independent_spring)
  const [descriptionCare, setDescriptionCare] = useState(CARE_TEMPLATE)

  // Розміри та ціни
  const [sizePrices, setSizePrices] = useState<SizePrice[]>(
    MATTRESS_SIZES.map(s => ({ 
      size: s.size, 
      price: 0, 
      enabled: true 
    }))
  )
  const [basePrice, setBasePrice] = useState(7990)

  // Автогенерація handle
  const handleTitleChange = (value: string) => {
    setTitle(value)
    setHandle(value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
  }

  // Зміна типу блоку - оновлює шаблон опису
  const handleBlockTypeChange = (value: string) => {
    setBlockType(value)
    setDescriptionMain(DESCRIPTION_TEMPLATES[value as keyof typeof DESCRIPTION_TEMPLATES] || "")
  }

  // Застосувати базову ціну до всіх розмірів
  const applyBasePriceToAll = () => {
    setSizePrices(prev => prev.map(sp => ({ ...sp, price: basePrice })))
  }

  // Toggle filler
  const toggleFiller = (filler: string) => {
    setSelectedFillers(prev => 
      prev.includes(filler) 
        ? prev.filter(f => f !== filler)
        : [...prev, filler]
    )
  }

  // Оновити ціну для розміру
  const updateSizePrice = (size: string, price: number) => {
    setSizePrices(prev => 
      prev.map(sp => sp.size === size ? { ...sp, price } : sp)
    )
  }

  // Toggle розмір
  const toggleSize = (size: string) => {
    setSizePrices(prev => 
      prev.map(sp => sp.size === size ? { ...sp, enabled: !sp.enabled } : sp)
    )
  }

  // Відправка форми
  const handleSubmit = async () => {
    if (!title) {
      alert("Введіть назву матраца")
      return
    }

    const enabledSizes = sizePrices.filter(sp => sp.enabled && sp.price > 0)
    if (enabledSizes.length === 0) {
      alert("Додайте хоча б один розмір з ціною")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/admin/mattresses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          handle,
          height,
          hardness,
          block_type: blockType,
          cover_type: coverType,
          max_weight: maxWeight,
          fillers: selectedFillers,
          description_main: descriptionMain,
          description_care: descriptionCare,
          specs: generateSpecs(),
          is_new: isNew,
          discount_percent: discountPercent,
          variants: enabledSizes.map(sp => ({
            size: sp.size,
            price: sp.price,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create")
      }

      navigate("/app/mattresses")
    } catch (error: any) {
      alert(`Помилка: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Генерація специфікацій
  const generateSpecs = (): string[] => {
    const specs = [
      `Допустиме навантаження - ${maxWeight} кг`,
      `Рівень жорсткості - ${hardness}`,
      `Висота - ${height} см`,
    ]
    
    const blockLabels: Record<string, string> = {
      independent_spring: "Незалежний пружинний блок",
      bonnel_spring: "Залежний пружинний блок",
      springless: "Безпружинна конструкція",
    }
    specs.push(blockLabels[blockType])

    return specs
  }

  // Групування розмірів по категоріях
  const sizesByCategory = MATTRESS_SIZES.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s.size)
    return acc
  }, {} as Record<string, string[]>)

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center gap-x-4 px-6 py-4">
          <Button variant="transparent" onClick={() => navigate("/app/mattresses")}>
            <ArrowLeft />
          </Button>
          <Heading level="h1">Створити матрац</Heading>
        </div>
      </Container>

      {/* Основна інформація */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Основна інформація</Heading>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Назва матраца *</Label>
              <Input
                id="title"
                placeholder="Orthopedic AirFlow Pro"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="handle">URL (handle)</Label>
              <Input
                id="handle"
                placeholder="orthopedic-airflow-pro"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <Select value={blockType} onValueChange={handleBlockTypeChange}>
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
              <Label>Макс. навантаження (кг)</Label>
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
                  className="cursor-pointer"
                  onClick={() => toggleFiller(filler.value)}
                >
                  {filler.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Container>

      {/* Розміри та ціни */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Heading level="h2">Розміри та ціни</Heading>
            <div className="flex items-center gap-x-2">
              <Label>Базова ціна:</Label>
              <Input
                type="number"
                className="w-32"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
              />
              <Button variant="secondary" onClick={applyBasePriceToAll}>
                Застосувати до всіх
              </Button>
            </div>
          </div>

          {Object.entries(sizesByCategory).map(([category, sizes]) => (
            <div key={category} className="mb-6">
              <Text className="font-medium text-gray-700 mb-2">{category}</Text>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sizes.map(size => {
                  const sizeData = sizePrices.find(sp => sp.size === size)!
                  return (
                    <div 
                      key={size}
                      className={`border rounded-lg p-3 ${
                        sizeData.enabled ? 'border-gray-200' : 'border-gray-100 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium">{size}</Label>
                        <Switch 
                          checked={sizeData.enabled}
                          onCheckedChange={() => toggleSize(size)}
                        />
                      </div>
                      <Input
                        type="number"
                        placeholder="Ціна"
                        value={sizeData.price || ""}
                        onChange={(e) => updateSizePrice(size, Number(e.target.value))}
                        disabled={!sizeData.enabled}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
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
                rows={4}
                value={descriptionMain}
                onChange={(e) => setDescriptionMain(e.target.value)}
              />
              <Text className="text-xs text-gray-500 mt-1">
                Шаблон заповнено автоматично на основі типу блоку
              </Text>
            </div>

            <div>
              <Label>Рекомендації по догляду</Label>
              <Textarea
                rows={3}
                value={descriptionCare}
                onChange={(e) => setDescriptionCare(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Actions */}
      <Container className="p-0">
        <div className="flex justify-end gap-x-2 px-6 py-4">
          <Button 
            variant="secondary" 
            onClick={() => navigate("/app/mattresses")}
          >
            Скасувати
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Створення..." : "Створити матрац"}
          </Button>
        </div>
      </Container>
    </div>
  )
}

export default CreateMattressPage
