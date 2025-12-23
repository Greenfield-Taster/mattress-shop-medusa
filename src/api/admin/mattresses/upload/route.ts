import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Logger } from "@medusajs/framework/types"

/**
 * POST /admin/mattresses/upload
 *
 * Завантажує зображення через Medusa File Module Service.
 * Файли зберігаються в /static директорії, яка обслуговується MedusaJS.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fileModuleService = req.scope.resolve(Modules.FILE) as any

    // Отримуємо файли з запиту (multer middleware з memoryStorage)
    const files = (req as any).files as any[]

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "No files provided"
      })
    }

    // Завантажуємо через File Module Service
    // File Module автоматично збереже в /static і поверне правильний URL
    const uploadedFiles = await Promise.all(
      files.map(async (file: any) => {
        const [result] = await fileModuleService.createFiles([{
          filename: file.originalname,
          mimeType: file.mimetype,
          content: file.buffer.toString("base64"),
          access: "public",
        }])

        return result
      })
    )

    // File Module Service повертає правильні URLs з /static
    // URL формується як: backend_url + "/" + fileKey
    // Наприклад: http://localhost:9000/static/1234567890-image.jpg
    const urls = uploadedFiles.map((file: any) => file.url)

    res.json({
      files: uploadedFiles,
      urls,
      message: `Успішно завантажено ${urls.length} файл(ів)`,
    })
  } catch (error: unknown) {
    const logger: Logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logger.error(`Upload error: ${errorMessage}`)
    res.status(400).json({
      message: errorMessage
    })
  }
}
