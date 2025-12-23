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
import { useQueryClient } from "@tanstack/react-query"
import { useState, useRef, useCallback } from "react"
import { ArrowLeft, Photo, XMark } from "@medusajs/icons"

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

// ===== КОМПОНЕНТ =====

const CreateMattressPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Основні дані
  const [title, setTitle] = useState("")
  const [handle, setHandle] = useState("")
  
  // Зображення (URLs від сервера)
  const [images, setImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  
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

  const handleTitleChange = (value: string) => {
    setTitle(value)
    const transliterated = transliterate(value)
    setHandle(transliterated.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
  }

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

  const handleBlockTypeChange = (value: string) => {
    setBlockType(value)
    setDescriptionMain(DESCRIPTION_TEMPLATES[value] || "")
  }

  const applyBasePriceToAll = () => {
    setSizePrices(prev => prev.map(sp => ({ ...sp, price: basePrice })))
  }

  const toggleFiller = (filler: string) => {
    setSelectedFillers(prev => 
      prev.includes(filler) 
        ? prev.filter(f => f !== filler)
        : [...prev, filler]
    )
  }

  const updateSizePrice = (size: string, price: number) => {
    setSizePrices(prev => 
      prev.map(sp => sp.size === size ? { ...sp, price } : sp)
    )
  }

  const toggleSize = (size: string) => {
    setSizePrices(prev => 
      prev.map(sp => sp.size === size ? { ...sp, enabled: !sp.enabled } : sp)
    )
  }

  const toggleCategory = (category: string, enabled: boolean) => {
    const categorySizes = MATTRESS_SIZES.filter(s => s.category === category).map(s => s.size)
    setSizePrices(prev => 
      prev.map(sp => categorySizes.includes(sp.size) ? { ...sp, enabled } : sp)
    )
  }

  // ===== IMAGE UPLOAD =====

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return

    // Фільтруємо тільки зображення
    const imageFiles = files.filter(f => f.type.startsWith("image/"))
    if (imageFiles.length === 0) {
      toast.error("Помилка", { description: "Дозволені тільки зображення" })
      return
    }

    if (images.length + imageFiles.length > 10) {
      toast.error("Помилка", { description: "Максимум 10 зображень" })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      imageFiles.forEach(file => {
        formData.append("files", file)
      })

      const response = await fetch("/admin/mattresses/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Upload failed")
      }

      const data = await response.json()
      
      setImages(prev => [...prev, ...data.urls])
      toast.success("Успіх", { description: `Завантажено ${data.urls.length} зображень` })
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error("Помилка завантаження", { description: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    uploadFiles(files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    uploadFiles(files)
  }, [images])

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // ===== SUBMIT =====

  const handleSubmit = async () => {
    setError(null)

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
      const response = await fetch(`/admin/mattresses`, {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          handle: handle || undefined,
          images: images,
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

      toast.success("Успіх", { description: "Матрац успішно створено" })
      queryClient.invalidateQueries({ queryKey: ["mattresses"] })
      setTimeout(() => navigate("/mattresses"), 500)

    } catch (err: any) {
      console.error("Create error:", err)
      setError(err.message || "Помилка створення матраца")
      toast.error("Помилка", { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

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

  const sizesByCategory = MATTRESS_SIZES.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s.size)
    return acc
  }, {} as Record<string, string[]>)

  const enabledCount = sizePrices.filter(sp => sp.enabled).length
  const withPriceCount = sizePrices.filter(sp => sp.enabled && sp.price > 0).length

  return (
    <>
      <Toaster />
      <div className="flex flex-col gap-y-4 pb-8">
      
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
            <div className="px-6 py-4 text-red-700">{error}</div>
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
                <Text className="text-xs text-gray-500 mt-1">Генерується автоматично з назви</Text>
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
            
            {/* Drop zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer mb-4
                ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
                ${isUploading ? "opacity-50 pointer-events-none" : ""}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <Photo className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              
              {isUploading ? (
                <Text className="text-gray-600">Завантаження...</Text>
              ) : (
                <>
                  <Text className="text-gray-600 font-medium">Перетягніть зображення сюди</Text>
                  <Text className="text-gray-400 text-sm mt-1">або натисніть для вибору файлів</Text>
                  <Text className="text-gray-400 text-xs mt-2">PNG, JPG, WebP до 10MB. Максимум 10 файлів.</Text>
                </>
              )}
            </div>

            {/* Список зображень */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map((url, index) => (
                  <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-50">
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E"
                      }}
                    />
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(index)
                        }}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <XMark className="w-4 h-4" />
                      </button>
                    </div>

                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Головне
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <Text className="text-gray-400 text-sm mt-4">
                Перше зображення буде використано як головне (thumbnail). Завантажено: {images.length}/10
              </Text>
            )}
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
                    <Select.Value placeholder="Виберіть" />
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
                    <Select.Value placeholder="Виберіть" />
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
                    <Select.Value placeholder="Виберіть" />
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
                  💡 Шаблон заповнено автоматично на основі типу блоку
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
    </>
  )
}

export default CreateMattressPage
