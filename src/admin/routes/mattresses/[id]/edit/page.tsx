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
import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Plus, Trash } from "@medusajs/icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ===== КОНСТАНТИ =====

const HARDNESS_OPTIONS = [
  { value: "H1", label: "H1 (м'який)" },
  { value: "H2", label: "H2 (нижче середньої)" },
  { value: "H3", label: "H3 (середня)" },
  { value: "H4", label: "H4 (жорсткий)" },
  { value: "H5", label: "H5 (дуже жорсткий)" },
]

const BLOCK_TYPE_OPTIONS = [
  { value: "independent_spring", label: "Незалежний пружинний блок" },
  { value: "bonnel_spring", label: "Залежний пружинний блок (Bonnel)" },
  { value: "springless", label: "Безпружинний" },
]

// Синхронізовано з фронтендом (Catalog.jsx filterOptions.types)
const PRODUCT_TYPE_OPTIONS = [
  { value: "springless", label: "Безпружинні" },
  { value: "spring", label: "Пружинні" },
  { value: "children", label: "Дитячі" },
  { value: "topper", label: "Топери" },
  { value: "rolled", label: "Скручені" },
  { value: "accessories", label: "Аксесуари" },
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

interface ProductImage {
  id?: string
  url: string
}

// ===== КОМПОНЕНТ =====

const EditMattressPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Прапорець чи форма ініціалізована
  const [isInitialized, setIsInitialized] = useState(false)

  // Стан форми - основні
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState("published")
  
  // Стан форми - зображення
  const [images, setImages] = useState<ProductImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Стан форми - атрибути
  const [height, setHeight] = useState(20)
  const [hardness, setHardness] = useState("H3")
  const [blockType, setBlockType] = useState("independent_spring")
  const [coverType, setCoverType] = useState("removable")
  const [maxWeight, setMaxWeight] = useState(120)
  const [selectedFillers, setSelectedFillers] = useState<string[]>([])
  const [productType, setProductType] = useState("springless")
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

  // Скидаємо стан ініціалізації при зміні id матраца
  useEffect(() => {
    setIsInitialized(false)
  }, [id])

  // Заповнення форми даними (при зміні data або після скидання isInitialized)
  useEffect(() => {
    if (data?.mattress && !isInitialized) {
      const m = data.mattress
      setTitle(m.title || "")
      setStatus(m.status || "published")

      // Зображення
      if (m.images && m.images.length > 0) {
        setImages(m.images.map((img: any) => ({ id: img.id, url: img.url })))
      } else if (m.thumbnail) {
        setImages([{ url: m.thumbnail }])
      } else {
        setImages([])
      }

      // Атрибути матраца
      if (m.mattress_attributes) {
        setHeight(m.mattress_attributes.height || 20)
        setHardness(m.mattress_attributes.hardness || "H3")
        setBlockType(m.mattress_attributes.block_type || "independent_spring")
        setCoverType(m.mattress_attributes.cover_type || "removable")
        setMaxWeight(m.mattress_attributes.max_weight || 120)
        setSelectedFillers(m.mattress_attributes.fillers || [])
        setProductType(m.mattress_attributes.product_type || "springless")
        setIsNew(m.mattress_attributes.is_new || false)
        setDiscountPercent(m.mattress_attributes.discount_percent || 0)
        setDescriptionMain(m.mattress_attributes.description_main || "")
        setDescriptionCare(m.mattress_attributes.description_care || "")
      } else {
        // Скидаємо до дефолтних значень якщо атрибутів немає
        setHeight(20)
        setHardness("H3")
        setBlockType("independent_spring")
        setCoverType("removable")
        setMaxWeight(120)
        setSelectedFillers([])
        setProductType("springless")
        setIsNew(false)
        setDiscountPercent(0)
        setDescriptionMain("")
        setDescriptionCare("")
      }

      // Ціни варіантів
      if (m.variants) {
        const prices = m.variants.map((v: any) => ({
          id: v.id,
          title: v.title,
          price: v.prices?.find((p: any) => p.currency_code === "uah")?.amount || 0,
        }))
        setVariantPrices(prices)
      } else {
        setVariantPrices([])
      }

      setIsInitialized(true)
    }
  }, [data, isInitialized])

  // === Завантаження зображень ===
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return

    // Валідація
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
      imageFiles.forEach(file => formData.append("files", file))

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
      
      // Додаємо нові URL до списку
      const newImages = data.urls.map((url: string) => ({ url }))
      setImages(prev => [...prev, ...newImages])
      
      toast.success("Успіх", { 
        description: `Завантажено ${data.urls.length} зображень` 
      })
    } catch (error: any) {
      toast.error("Помилка", { description: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  // File input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    uploadFiles(files)
    e.target.value = "" // Reset input
  }

  // Drag & drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    uploadFiles(files)
  }

  // Видалення зображення
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

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
      // Інвалідуємо кеш списку та конкретного матраца
      queryClient.invalidateQueries({ queryKey: ["mattresses"] })
      queryClient.invalidateQueries({ queryKey: ["mattress", id] })
      // Redirect to list after successful save
      setTimeout(() => {
        navigate("/mattresses")
      }, 500)
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
      images: images.map(img => img.url),
      height,
      hardness,
      block_type: blockType,
      cover_type: coverType,
      max_weight: maxWeight,
      fillers: selectedFillers,
      product_type: productType,
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

  // Loading state
  if (isLoading || !isInitialized) {
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
    <>
      <Toaster />
      <div className="flex flex-col gap-y-4 pb-8">
      
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

      {/* Зображення */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">Зображення</Heading>
          
          {/* Сітка зображень */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {images.map((img, index) => (
              <div 
                key={index} 
                className="relative aspect-square rounded-lg overflow-hidden border group"
              >
                <img
                  src={img.url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='12'%3EПомилка%3C/text%3E%3C/svg%3E"
                  }}
                />
                
                {/* Позначка головного зображення */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                    Головне
                  </div>
                )}
                
                {/* Кнопка видалення */}
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {/* Зона завантаження */}
            {images.length < 10 && (
              <div
                className={`
                  aspect-square rounded-lg border-2 border-dashed 
                  flex flex-col items-center justify-center cursor-pointer
                  transition-colors
                  ${isDragging 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-300 hover:border-gray-400"
                  }
                  ${isUploading ? "opacity-50 pointer-events-none" : ""}
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                ) : (
                  <>
                    <Plus className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 text-center px-2">
                      Перетягніть або натисніть
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Text className="text-gray-500 text-sm">
            Перше зображення буде використано як головне. Максимум 10 зображень.
          </Text>
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
                  <Select.Value placeholder="Виберіть статус" />
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
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <Label>Тип товару</Label>
              <Select value={productType} onValueChange={setProductType}>
                <Select.Trigger>
                  <Select.Value placeholder="Виберіть" />
                </Select.Trigger>
                <Select.Content>
                  {PRODUCT_TYPE_OPTIONS.map(opt => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

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
              <Label>Тип блоку</Label>
              <Select value={blockType} onValueChange={setBlockType}>
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
              <Label>Чохол</Label>
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
              <div key={vp.id} className="border border-ui-border-base bg-ui-bg-base rounded-lg p-3">
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
    </>
  )
}

export default EditMattressPage
