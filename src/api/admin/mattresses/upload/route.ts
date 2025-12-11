import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * POST /admin/mattresses/upload
 * 
 * Завантажує зображення через Medusa File Service
 * 
 * Приймає: multipart/form-data з полем "files"
 * Повертає: масив URLs завантажених файлів
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fileService = req.scope.resolve(Modules.FILE)

    // Отримуємо файли з запиту
    const files = (req as any).files as Express.Multer.File[]

    if (!files || files.length === 0) {
      return res.status(400).json({ 
        message: "No files provided" 
      })
    }

    // Завантажуємо кожен файл
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const result = await fileService.createFiles({
          filename: file.originalname,
          mimeType: file.mimetype,
          content: file.buffer.toString("base64"),
          access: "public",
        })
        return result
      })
    )

    // Повертаємо URLs
    const urls = uploadedFiles.map((f: any) => f.url)

    res.json({ 
      files: uploadedFiles,
      urls,
    })
  } catch (error: any) {
    console.error("Error uploading files:", error)
    res.status(400).json({ 
      message: error.message 
    })
  }
}
