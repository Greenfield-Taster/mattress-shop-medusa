import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
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
              backend_url: process.env.BACKEND_URL || "http://localhost:9000/static",
            },
          },
        ],
      },
    },
  ],
})
