import { useState, useCallback } from "react"
import { Button, Text, toast } from "@medusajs/ui"
import { XMark, Photo } from "@medusajs/icons"

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxFiles?: number
}

/**
 * Компонент для завантаження зображень з drag-and-drop
 */
export const ImageUploader = ({ 
  images, 
  onChange, 
  maxFiles = 10 
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Завантаження файлів на сервер
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return

    // Перевірка кількості
    if (images.length + files.length > maxFiles) {
      toast.error("Помилка", { 
        description: `Максимум ${maxFiles} зображень` 
      })
      return
    }

    // Перевірка типу файлів
    const invalidFiles = files.filter(f => !f.type.startsWith("image/"))
    if (invalidFiles.length > 0) {
      toast.error("Помилка", { 
        description: "Дозволені тільки зображення" 
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      files.forEach(file => {
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
      
      // Додаємо нові URLs до списку
      onChange([...images, ...data.urls])
      
      toast.success("Успіх", { 
        description: `Завантажено ${data.urls.length} зображень` 
      })
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error("Помилка завантаження", { 
        description: error.message 
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Обробка вибору файлів через input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    uploadFiles(files)
    // Очищаємо input для повторного вибору тих самих файлів
    e.target.value = ""
  }

  // Drag and drop handlers
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
  }, [images, onChange])

  // Видалення зображення
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  // Переміщення зображення (для сортування)
  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [removed] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, removed)
    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragging 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
          }
          ${isUploading ? "opacity-50 pointer-events-none" : ""}
        `}
        onClick={() => document.getElementById("image-upload-input")?.click()}
      >
        <input
          id="image-upload-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Photo className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        
        {isUploading ? (
          <Text className="text-gray-600">Завантаження...</Text>
        ) : (
          <>
            <Text className="text-gray-600 font-medium">
              Перетягніть зображення сюди
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              або натисніть для вибору файлів
            </Text>
            <Text className="text-gray-400 text-xs mt-2">
              PNG, JPG, WebP до 10MB. Максимум {maxFiles} файлів.
            </Text>
          </>
        )}
      </div>

      {/* Список завантажених зображень */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((url, index) => (
            <div 
              key={url} 
              className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-50"
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Placeholder якщо зображення не завантажилось
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E"
                }}
              />
              
              {/* Overlay з кнопками */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Кнопка видалення */}
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

              {/* Індикатор першого зображення (thumbnail) */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Головне
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Підказка */}
      {images.length > 0 && (
        <Text className="text-gray-400 text-sm">
          Перше зображення буде використано як головне (thumbnail). 
          Завантажено: {images.length}/{maxFiles}
        </Text>
      )}
    </div>
  )
}

export default ImageUploader
