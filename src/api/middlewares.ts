import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { z } from "zod"
import multer from "multer"

// Multer для завантаження файлів в пам'ять
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Дозволяємо тільки зображення
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

/**
 * Схема валідації для створення матраца
 */
const CreateMattressSchema = z.object({
  // Основні дані продукту
  title: z.string().min(1, "Назва обов'язкова"),
  handle: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),

  // Атрибути матраца
  height: z.number().min(3).max(50),
  hardness: z.enum(["H1", "H2", "H3", "H4"]),
  block_type: z.enum(["independent_spring", "bonnel_spring", "springless"]),
  cover_type: z.enum(["removable", "non_removable"]),
  max_weight: z.number().min(30).max(250),
  fillers: z.array(z.string()).optional(),
  
  // Опис
  description_main: z.string().optional(),
  description_care: z.string().optional(),
  specs: z.array(z.string()).optional(),
  
  // Прапорці
  is_new: z.boolean().optional(),
  discount_percent: z.number().min(0).max(100).optional(),

  // Варіанти (розміри з цінами)
  variants: z.array(z.object({
    size: z.string(),
    price: z.number().min(0),
  })).min(1, "Додайте хоча б один розмір"),
})

/**
 * Схема валідації для оновлення матраца
 */
const UpdateMattressSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  // Зображення - масив URL
  images: z.array(z.string()).optional(),
  // Атрибути матраца
  height: z.number().min(3).max(50).optional(),
  hardness: z.enum(["H1", "H2", "H3", "H4"]).optional(),
  block_type: z.enum(["independent_spring", "bonnel_spring", "springless"]).optional(),
  cover_type: z.enum(["removable", "non_removable"]).optional(),
  max_weight: z.number().min(30).max(250).optional(),
  fillers: z.array(z.string()).optional(),
  description_main: z.string().optional(),
  description_care: z.string().optional(),
  specs: z.array(z.string()).optional(),
  is_new: z.boolean().optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  // Оновлення цін варіантів
  variants: z.array(z.object({
    id: z.string(),
    price: z.number().min(0),
  })).optional(),
})

/**
 * Схема валідації для створення промокоду
 */
const CreatePromoCodeSchema = z.object({
  code: z.string().min(1, "Код промокоду обов'язковий").transform(val => val.toUpperCase().trim()),
  description: z.string().optional(),
  discount_type: z.enum(["percentage", "fixed"], {
    errorMap: () => ({ message: "Тип знижки має бути 'percentage' або 'fixed'" })
  }),
  discount_value: z.number().min(1, "Значення знижки має бути більше 0"),
  min_order_amount: z.number().min(0).optional().default(0),
  max_uses: z.number().min(0).optional().default(0),
  starts_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional().default(true),
}).refine(
  (data) => !(data.discount_type === "percentage" && data.discount_value > 100),
  { message: "Відсоток знижки не може перевищувати 100", path: ["discount_value"] }
)

/**
 * Схема валідації для оновлення промокоду
 */
const UpdatePromoCodeSchema = z.object({
  code: z.string().min(1).transform(val => val.toUpperCase().trim()).optional(),
  description: z.string().optional().nullable(),
  discount_type: z.enum(["percentage", "fixed"]).optional(),
  discount_value: z.number().min(1).optional(),
  min_order_amount: z.number().min(0).optional(),
  max_uses: z.number().min(0).optional(),
  starts_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional(),
})

export default defineMiddlewares({
  routes: [
    // Валідація створення матраца
    {
      method: "POST",
      matcher: "/admin/mattresses",
      middlewares: [
        validateAndTransformBody(CreateMattressSchema),
      ],
    },
    // Валідація оновлення матраца
    {
      method: "PUT",
      matcher: "/admin/mattresses/:id",
      middlewares: [
        validateAndTransformBody(UpdateMattressSchema),
      ],
    },
    // Завантаження зображень
    {
      method: "POST",
      matcher: "/admin/mattresses/upload",
      middlewares: [
        upload.array("files", 10),
      ],
    },
    // Валідація створення промокоду
    {
      method: "POST",
      matcher: "/admin/promo-codes",
      middlewares: [
        validateAndTransformBody(CreatePromoCodeSchema),
      ],
    },
    // Валідація оновлення промокоду
    {
      method: "PUT",
      matcher: "/admin/promo-codes/:id",
      middlewares: [
        validateAndTransformBody(UpdatePromoCodeSchema),
      ],
    },
  ],
})
