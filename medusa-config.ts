import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: [
    // Кастомний модуль для атрибутів матраців
    {
      resolve: "./src/modules/mattress",
    },
    // Модуль промокодів
    {
      resolve: "./src/modules/promo-code",
    },
    // Модуль користувачів (автентифікація)
    {
      resolve: "./src/modules/customer",
    },
    // Модуль замовлень
    {
      resolve: "./src/modules/order",
    },
    // Модуль відгуків
    {
      resolve: "./src/modules/review",
    },
    // Notification module (Resend email provider)
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "./src/modules/resend",
            id: "resend",
            options: {
              channels: ["email"],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            },
          },
        ],
      },
    },
    // Local File Provider - для development
    // ВАЖЛИВО: MedusaJS обслуговує тільки /static директорію через Express.static
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              // Директорія для збереження файлів (static - обслуговується MedusaJS)
              upload_dir: "static",
              // URL бекенду для формування URL файлів (з /static на кінці)
              backend_url: process.env.BACKEND_URL,
            },
          },
        ],
      },
    },
  ],
})
