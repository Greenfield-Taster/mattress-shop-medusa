import {
  Container,
  Heading,
  Button,
  Badge,
  Text,
  toast,
  Toaster,
  usePrompt,
} from "@medusajs/ui"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, PencilSquare, Trash } from "@medusajs/icons"

const HARDNESS_OPTIONS: Record<string, string> = {
  H1: "H1 (м'який)",
  H2: "H2 (нижче середньої)",
  H3: "H3 (середня)",
  H4: "H4 (жорсткий)",
  H5: "H5 (дуже жорсткий)",
}

const BLOCK_TYPE_OPTIONS: Record<string, string> = {
  springless: "Безпружинний",
  independent_spring: "Незалежний пружинний блок",
  bonnel_spring: "Залежний пружинний блок (Bonnel)",
}

const PRODUCT_TYPE_OPTIONS: Record<string, string> = {
  springless: "Безпружинні",
  spring: "Пружинні",
  children: "Дитячі",
  topper: "Топери",
  rolled: "Скручені",
  accessories: "Аксесуари",
}

const COVER_TYPE_OPTIONS: Record<string, string> = {
  removable: "Знімний",
  non_removable: "Незнімний",
}

const FILLER_OPTIONS: Record<string, string> = {
  latex: "Латекс",
  latex_foam: "Латексована піна",
  memory_foam: "Піна з пам'яттю",
  coconut: "Кокосове полотно",
}

const formatPrice = (amount: number): string => {
  return `${amount.toLocaleString("uk-UA")} грн`
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

const ViewMattressPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const prompt = usePrompt()

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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/admin/mattresses/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed to delete mattress")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Успіх", { description: "Матрац видалено" })
      queryClient.invalidateQueries({ queryKey: ["mattresses"] })
      setTimeout(() => navigate("/mattresses"), 500)
    },
    onError: (error: Error) => {
      toast.error("Помилка", { description: error.message })
    },
  })

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: "Видалити матрац?",
      description: `Ви впевнені що хочете видалити "${mattress?.title}"? Цю дію неможливо скасувати.`,
      confirmText: "Видалити",
      cancelText: "Скасувати",
    })

    if (confirmed) {
      deleteMutation.mutate()
    }
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
          Помилка завантаження: {(error as Error).message}
        </Text>
        <Button
          variant="secondary"
          onClick={() => navigate("/mattresses")}
          className="mt-4"
        >
          Назад до списку
        </Button>
      </Container>
    )
  }

  const mattress = data?.mattress
  if (!mattress) return null

  const attrs = mattress.mattress_attributes
  const variants = mattress.variants || []

  const variantsByCategory: Record<string, typeof variants> = {}
  for (const v of variants) {
    const size = v.title || ""
    const [w] = size.split("×").map(Number)
    let category = "Інші"
    if (w <= 70) category = "Дитячий"
    else if (w <= 90) category = "Односпальний"
    else if (w <= 120) category = "Полуторний"
    else if (w <= 170) category = "Двоспальний"
    else if (w <= 180) category = "King Size"
    else category = "King Size XL"

    if (!variantsByCategory[category]) variantsByCategory[category] = []
    variantsByCategory[category].push(v)
  }

  return (
    <>
      <Toaster />
      <div className="flex flex-col gap-y-4 pb-8">
        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-x-4">
              <Button
                variant="transparent"
                onClick={() => navigate("/mattresses")}
              >
                <ArrowLeft />
              </Button>
              <div>
                <Heading level="h1">{mattress.title}</Heading>
                <Text className="text-gray-500">{mattress.handle}</Text>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate(`/mattresses/${id}/edit`)}
              >
                <PencilSquare className="mr-2" />
                Редагувати
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash className="mr-2" />
                Видалити
              </Button>
            </div>
          </div>
        </Container>

        {mattress.images && mattress.images.length > 0 && (
          <Container className="divide-y p-0">
            <div className="px-6 py-4">
              <Heading level="h2" className="mb-4">
                Зображення
              </Heading>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {mattress.images.map(
                  (img: { id?: string; url: string }, index: number) => (
                    <div
                      key={img.id || index}
                      className="relative aspect-square rounded-lg overflow-hidden border"
                    >
                      <img
                        src={img.url}
                        alt={`${mattress.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                          Головне
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </Container>
        )}

        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2" className="mb-4">
              Основна інформація
            </Heading>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Text className="text-xs text-gray-500 mb-1">Статус</Text>
                <Badge
                  color={mattress.status === "published" ? "green" : "grey"}
                >
                  {mattress.status === "published" ? "Активний" : "Чернетка"}
                </Badge>
              </div>

              <div>
                <Text className="text-xs text-gray-500 mb-1">ID</Text>
                <Text className="font-mono text-sm break-all">
                  {mattress.id}
                </Text>
              </div>

              <div>
                <Text className="text-xs text-gray-500 mb-1">Створено</Text>
                <Text className="text-sm">
                  {formatDate(mattress.created_at)}
                </Text>
              </div>

              <div>
                <Text className="text-xs text-gray-500 mb-1">Оновлено</Text>
                <Text className="text-sm">
                  {formatDate(mattress.updated_at)}
                </Text>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {attrs?.is_new && <Badge color="orange">Новинка</Badge>}
              {(attrs?.discount_percent ?? 0) > 0 && (
                <Badge color="red">Знижка -{attrs.discount_percent}%</Badge>
              )}
            </div>
          </div>
        </Container>

        {attrs && (
          <Container className="divide-y p-0">
            <div className="px-6 py-4">
              <Heading level="h2" className="mb-4">
                Характеристики
              </Heading>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-ui-bg-subtle rounded-lg p-3">
                  <Text className="text-xs text-gray-500 mb-1">
                    Тип товару
                  </Text>
                  <Text className="font-medium">
                    {PRODUCT_TYPE_OPTIONS[attrs.product_type] ||
                      attrs.product_type ||
                      "—"}
                  </Text>
                </div>

                <div className="bg-ui-bg-subtle rounded-lg p-3">
                  <Text className="text-xs text-gray-500 mb-1">
                    Висота
                  </Text>
                  <Text className="font-medium">{attrs.height} см</Text>
                </div>

                <div className="bg-ui-bg-subtle rounded-lg p-3">
                  <Text className="text-xs text-gray-500 mb-1">
                    Жорсткість
                  </Text>
                  <Text className="font-medium">
                    {HARDNESS_OPTIONS[attrs.hardness] || attrs.hardness}
                  </Text>
                </div>

                <div className="bg-ui-bg-subtle rounded-lg p-3">
                  <Text className="text-xs text-gray-500 mb-1">
                    Тип блоку
                  </Text>
                  <Text className="font-medium">
                    {BLOCK_TYPE_OPTIONS[attrs.block_type] || attrs.block_type}
                  </Text>
                </div>

                <div className="bg-ui-bg-subtle rounded-lg p-3">
                  <Text className="text-xs text-gray-500 mb-1">Чохол</Text>
                  <Text className="font-medium">
                    {COVER_TYPE_OPTIONS[attrs.cover_type] || attrs.cover_type}
                  </Text>
                </div>

                <div className="bg-ui-bg-subtle rounded-lg p-3">
                  <Text className="text-xs text-gray-500 mb-1">
                    Макс. вага
                  </Text>
                  <Text className="font-medium">{attrs.max_weight} кг</Text>
                </div>
              </div>

              {attrs.fillers && attrs.fillers.length > 0 && (
                <div className="mt-4">
                  <Text className="text-xs text-gray-500 mb-2">
                    Наповнювачі
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {attrs.fillers.map((filler: string) => (
                      <Badge key={filler} color="blue">
                        {FILLER_OPTIONS[filler] || filler}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Container>
        )}

        {variants.length > 0 && (
          <Container className="divide-y p-0">
            <div className="px-6 py-4">
              <Heading level="h2" className="mb-4">
                Розміри та ціни ({variants.length} варіантів)
              </Heading>

              {Object.entries(variantsByCategory).map(
                ([category, categoryVariants]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <Text className="font-medium text-gray-700 mb-2">
                      {category}
                    </Text>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {categoryVariants.map((v: any) => {
                        const uahPrice = v.prices?.find(
                          (p: any) => p.currency_code === "uah"
                        )
                        return (
                          <div
                            key={v.id}
                            className="border border-ui-border-base bg-ui-bg-base rounded-lg p-3"
                          >
                            <Text className="font-medium mb-1">{v.title}</Text>
                            <Text className="text-lg font-bold text-ui-fg-interactive">
                              {uahPrice
                                ? formatPrice(uahPrice.amount)
                                : "—"}
                            </Text>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </Container>
        )}

        {attrs &&
          (attrs.description_main || attrs.description_care) && (
            <Container className="divide-y p-0">
              <div className="px-6 py-4">
                <Heading level="h2" className="mb-4">
                  Опис
                </Heading>

                {attrs.description_main && (
                  <div className="mb-4">
                    <Text className="text-xs text-gray-500 mb-2">
                      Основний опис
                    </Text>
                    <div className="bg-ui-bg-subtle rounded-lg p-4">
                      <Text className="whitespace-pre-wrap">
                        {attrs.description_main}
                      </Text>
                    </div>
                  </div>
                )}

                {attrs.description_care && (
                  <div>
                    <Text className="text-xs text-gray-500 mb-2">
                      Рекомендації по догляду
                    </Text>
                    <div className="bg-ui-bg-subtle rounded-lg p-4">
                      <Text className="whitespace-pre-wrap">
                        {attrs.description_care}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Container>
          )}

        {attrs?.certificates &&
          Array.isArray(attrs.certificates) &&
          attrs.certificates.length > 0 && (
            <Container className="divide-y p-0">
              <div className="px-6 py-4">
                <Heading level="h2" className="mb-4">
                  Сертифікати ({attrs.certificates.length})
                </Heading>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attrs.certificates.map(
                    (
                      cert: {
                        title: string
                        image: string
                        description?: string
                      },
                      index: number
                    ) => (
                      <div
                        key={index}
                        className="border border-ui-border-base rounded-lg p-4 flex gap-4"
                      >
                        {cert.image && (
                          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                            <img
                              src={cert.image}
                              alt={cert.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <Text className="font-medium">{cert.title}</Text>
                          {cert.description && (
                            <Text className="text-sm text-gray-500 mt-1">
                              {cert.description}
                            </Text>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </Container>
          )}
      </div>
    </>
  )
}

export default ViewMattressPage
