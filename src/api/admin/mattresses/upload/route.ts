import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import type { Logger } from "@medusajs/framework/types"

/**
 * POST /admin/mattresses/upload
 *
 * Завантажує зображення через Medusa uploadFilesWorkflow.
 * Файли зберігаються в /static директорії, яка обслуговується MedusaJS.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger: Logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    // Отримуємо файли з запиту (multer middleware з memoryStorage)
    const files = (req as any).files as Array<{
      fieldname: string
      originalname: string
      encoding: string
      mimetype: string
      buffer: Buffer
      size: number
    }>

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "No files provided"
      })
    }

    logger.debug(`Uploading ${files.length} files`)

    // Конвертуємо файли у формат для workflow
    // ВАЖЛИВО: content має бути в binary encoding (не base64!)
    const filesToUpload = files.map((file) => ({
      filename: file.originalname,
      mimeType: file.mimetype,
      content: file.buffer.toString("binary"),
      access: "public" as const,
    }))

    // Використовуємо офіційний workflow для завантаження
    const { result } = await uploadFilesWorkflow(req.scope).run({
      input: {
        files: filesToUpload,
      },
    })

    logger.debug(`Upload result: ${JSON.stringify(result)}`)

    // Workflow повертає FileDTO[] з id та url
    const urls = result.map((file: any) => file.url)

    res.json({
      files: result,
      urls,
      message: `Успішно завантажено ${urls.length} файл(ів)`,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error(`Upload error: ${errorMessage}`)
    logger.error(`Stack: ${errorStack}`)
    res.status(400).json({
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? errorStack : undefined,
    })
  }
}
