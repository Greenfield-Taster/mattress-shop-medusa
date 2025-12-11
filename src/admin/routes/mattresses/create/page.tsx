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
import { useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import { ArrowLeft, Photo, XMark, Plus } from "@medusajs/icons"

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

const DESCRIPTION_TEMPLATES: Record<string, string> = {
  independent_spring: `Матрац оптимальної жорсткості з ортопедичним ефектом. Основу моделі складає незалежний пружинний блок «Pocket Spring», який забезпечує індивідуальну підтримку кожної точки тіла. Модель має чудове співвідношення ціни та якості, забезпечуючи здоровий та міцний сон.`,
  bonnel_spring: `Класичний пружинний матрац з блоком Bonnel. Надійна конструкція забезпечує рівномірну підтримку тіла під час сну. Ідеальний вибір для тих, хто цінує перевірені часом рішення за доступною ціною.`,
  springless: `Безпружинний матрац з сучасних матеріалів. Відсутність металевих елементів забезпечує безшумність та довговічність. Ідеально підходить для тих, хто цінує екологічні матеріали та природний комфорт.`,
}

const CARE_TEMPLATE = `Виконувати глибоку чистку дозволяється тільки клінінговій компанії або хімчистці. Спеціалісти допоможуть зберегти м'якість та розміри виробу.

Не варто застосовувати засоби зі змістом хлору. Для екстреного видалення мокрих плям скористайтесь паперовими серветками.

Рекомендується провітрювати матрац кожні 2-3 місяці та перевертати його для рівномірного зношування.`

// ===== ТИПИ =====

interface SizePrice {
  size: string
  price: number
  enabled: boolean
}

interface ImageFile {
  id: string
  file?: File
  url: string
  isUploading?: boolean
}

// ===== КОМПОНЕНТ =====

const CreateMattressPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Основні дані
  const [title, setTitle] = useState("")
  const [handle, setHandle] = useState("")
  
  // Зображення
  const [images, setImages] = useState<ImageFile[]>([])
  
  // Характеристики
  const [height, setHeight] = useState(20)
  const [hardness, setHardness] = useState("H3")
  const [blockType, setBlockType] = useState("independent_spring")
  const [coverType, setCoverType] = useState("removable")
  const [maxWeight, setMaxWeight] = useState(120)
  const [selectedFillers, setSelectedFillers] = useState<string[]>(["latex"])
  
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

  // ===== HANDLERS =====

  // Автогенерація handle з підтримкою кирилиці
  const handleTitleChange = (value: string) => {
    setTitle(value)
    const transliterated = transliterate(value)
    setHandle(transliterated.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
  }

  // Транслітерація
  const transliterate = (text: string): string => {
    const map: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
      'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
      'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya',
    }
    return text.split('').map(char => {
      const lower = char.toLowerCase()
      return map[lower] !== undefined ? map[lower] : char
    }).join('')
  }

  // Зміна типу блоку - оновлює шаблон опису
  const handleBlockTypeChange = (value: string) => {
    setBlockType(value)
    setDescriptionMain(DESCRIPTION_TEMPLATES[value] || "")
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

  // Вибрати всі / зняти всі розміри в категорії
  const toggleCategory = (category: string, enabled: boolean) => {
    const categorySizes = MATTRESS_SIZES.filter(s => s.category === category).map(s => s.size)
    setSizePrices(prev => 
      prev.map(sp => categorySizes.includes(sp.size) ? { ...sp, enabled } : sp)
    )
  }

  // ===== IMAGES =====

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach(file => {
      const id = Math.random().toString(36).substring(7)
      const url = URL.createObjectURL(file)
      
      setImages(prev => [...prev, { id, file, url }])
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id)
      if (img?.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url)
      }
      return prev.filter(i => i.id !== id)
    })
  }

  // ===== SUBMIT =====

  const handleSubmit = async () => {
    setError(null)

    // Валідація
    if (!title.trim()) {
      setError("Введіть назву матраца")
      return
    }

    const enabledSizes = sizePrices.filter(sp => sp.enabled && sp.price > 0)
    if (enabledSizes.length === 0) {
      setError("Додайте хоча б один розмір з ціною")
      return
    }

    if (selectedFillers.length === 0) {
      setError("Виберіть хоча б один наповнювач")
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Завантажити зображення на сервер і отримати URLs
      // Поки що використовуємо placeholder
      const imageUrls = images.length > 0 
        ? images.map(img => img.url.startsWith('blob:') 
            ? "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" // placeholder
            : img.url
          )
        : []

      const response = await fetch(`/admin/mattresses`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          handle: handle || undefined,
          images: imageUrls,
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Помилка створення матраца")
      }

      toast.success("Успіх", {
        description: "Матрац успішно створено",
      })

      // Перенаправляємо на список
      setTimeout(() => {
        navigate("/mattresses")
      }, 1000)

    } catch (err: any) {
      console.error("Create error:", err)
      setError(err.message || "Помилка створення матраца")
      toast.error("Помилка", {
        description: err.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Генерація специфікацій
  const generateSpecs = (): string[] => {
    const specs = [
      `Допустиме навантаження на одне спальне місце - ${maxWeight} кг`,
      `Рівень жорсткості - ${HARDNESS_OPTIONS.find(h => h.value === hardness)?.label || hardness}`,
      `Регламентована висота - ${height} см`,
    ]
    
    const blockLabel = BLOCK_TYPE_OPTIONS.find(b => b.value === blockType)?.label
    if (blockLabel) specs.push(blockLabel)

    if (selectedFillers.length > 0) {
      const fillerLabels = selectedFillers
        .map(f => FILLER_OPTIONS.find(fo => fo.value === f)?.label)
        .filter(Boolean)
      specs.push(`Наповнювачі: ${fillerLabels.join(", ")}`)
    }

    return specs
  }

  // Групування розмірів по категоріях
  const sizesByCategory = MATTRESS_SIZES.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s.size)
    return acc
  }, {} as Record<string, string[]>)

  // Підрахунок увімкнених розмірів
  const enabledCount = sizePrices.filter(sp => sp.enabled).length
  const withPriceCount = sizePrices.filter(sp => sp.enabled && sp.price > 0).length

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <Toaster />
      
      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center gap-x-4 px-6 py-4">
          <Button variant="transparent" onClick={() => navigate("/mattresses")}>
            <ArrowLeft />
          </Button>
          <div>
            <Heading level="h1">Створити матрац</Heading>
            <Text className="text-gray-500">Заповніть всі поля для створення нового матраца</Text>
          </div>
        </div>
      </Container>

      {/* Error */}
      {error && (
        <Container className="bg-red-50 border-red-200">
          <div className="px-6 py-4 text-red-700">
            {error}
          </div>
        </Container>
      )}

      {/* Основна інформація */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Основна інформація</Heading>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Text className="text-xs text-gray-500 mt-1">
                Генерується автоматично з назви
              </Text>
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

      {/* Зображення */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Зображення</Heading>
          
          <div className="flex flex-wrap gap-4">
            {images.map((img, index) => (
              <div 
                key={img.id} 
                className="relative w-32 h-32 border rounded-lg overflow-hidden group"
              >
                <img 
                  src={img.url} 
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <XMark className="w-4 h-4" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                    Головне
                  </span>
                )}
              </div>
            ))}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              <Photo className="w-8 h-8 mb-2" />
              <span className="text-sm">Додати</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
          
          <Text className="text-xs text-gray-500 mt-2">
            Перше зображення буде використано як головне. Рекомендований розмір: 800×800 px
          </Text>
        </div>
      </Container>

      {/* Характеристики */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Характеристики</Heading>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label>Висота (см) *</Label>
              <Input
                type="number"
                min={3}
                max={40}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
            
            <div>
              <Label>Жорсткість *</Label>
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
              <Label>Тип блоку *</Label>
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
              <Label>Чохол *</Label>
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
              <Label>Макс. вага (кг) *</Label>
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
            <Label className="mb-2 block">Наповнювачі *</Label>
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

      {/* Розміри та ціни */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Heading level="h2">Розміри та ціни</Heading>
              <Text className="text-sm text-gray-500">
                Вибрано: {enabledCount} розмірів, з ціною: {withPriceCount}
              </Text>
            </div>
            <div className="flex items-center gap-x-2">
              <Label>Базова ціна:</Label>
              <Input
                type="number"
                className="w-32"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                placeholder="0"
              />
              <Button variant="secondary" onClick={applyBasePriceToAll}>
                Застосувати до всіх
              </Button>
            </div>
          </div>

          {Object.entries(sizesByCategory).map(([category, sizes]) => {
            const categoryEnabled = sizes.every(size => 
              sizePrices.find(sp => sp.size === size)?.enabled
            )
            
            return (
              <div key={category} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <Text className="font-medium text-gray-700">{category}</Text>
                  <Button 
                    variant="transparent" 
                    size="small"
                    onClick={() => toggleCategory(category, !categoryEnabled)}
                  >
                    {categoryEnabled ? "Зняти всі" : "Вибрати всі"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
                  {sizes.map(size => {
                    const sizeData = sizePrices.find(sp => sp.size === size)!
                    return (
                      <div 
                        key={size}
                        className={`border rounded-lg p-3 transition-all ${
                          sizeData.enabled 
                            ? 'border-gray-200 bg-white' 
                            : 'border-gray-100 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">{size}</Label>
                          <Switch 
                            checked={sizeData.enabled}
                            onCheckedChange={() => toggleSize(size)}
                          />
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="Ціна"
                            value={sizeData.price || ""}
                            onChange={(e) => updateSizePrice(size, Number(e.target.value))}
                            disabled={!sizeData.enabled}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            грн
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
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
                placeholder="Опис матраца..."
              />
              <Text className="text-xs text-gray-500 mt-1">
                💡 Шаблон заповнено автоматично на основі типу блоку. Ви можете редагувати текст.
              </Text>
            </div>

            <div>
              <Label>Рекомендації по догляду</Label>
              <Textarea
                rows={4}
                value={descriptionCare}
                onChange={(e) => setDescriptionCare(e.target.value)}
                placeholder="Рекомендації по догляду..."
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Превью специфікацій */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Специфікації (автогенерація)</Heading>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {generateSpecs().map((spec, i) => (
                <li key={i}>{spec}</li>
              ))}
            </ul>
          </div>
          <Text className="text-xs text-gray-500 mt-2">
            Ці специфікації генеруються автоматично на основі заповнених характеристик
          </Text>
        </div>
      </Container>

      {/* Actions */}
      <Container className="p-0 sticky bottom-0 bg-white border-t shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm text-gray-500">
            {withPriceCount === 0 && (
              <span className="text-amber-600">⚠️ Додайте ціни для розмірів</span>
            )}
          </div>
          <div className="flex gap-x-2">
            <Button 
              variant="secondary" 
              onClick={() => navigate("/mattresses")}
              disabled={isSubmitting}
            >
              Скасувати
            </Button>
            <Button 
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || withPriceCount === 0}
            >
              {isSubmitting ? "Створення..." : "Створити матрац"}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default CreateMattressPage
