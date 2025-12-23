import { MedusaService } from "@medusajs/framework/utils"
import MattressAttributes from "./models/mattress-attributes"
import type { InferTypeOf } from "@medusajs/framework/types"

// ===== ТИПИ =====

/**
 * Інферований тип для MattressAttributes entity
 */
export type MattressAttributesType = InferTypeOf<typeof MattressAttributes>

/**
 * DTO для створення MattressAttributes
 */
export interface CreateMattressAttributesDTO {
  height: number
  hardness: "H1" | "H2" | "H3" | "H4"
  block_type: "independent_spring" | "bonnel_spring" | "springless"
  cover_type: "removable" | "non_removable"
  max_weight: number
  fillers?: string[]
  description_main?: string | null
  description_care?: string | null
  specs?: string[] | null
  is_new?: boolean
  discount_percent?: number
}

/**
 * DTO для оновлення MattressAttributes
 */
export interface UpdateMattressAttributesDTO {
  id: string
  height?: number
  hardness?: "H1" | "H2" | "H3" | "H4"
  block_type?: "independent_spring" | "bonnel_spring" | "springless"
  cover_type?: "removable" | "non_removable"
  max_weight?: number
  fillers?: string[]
  description_main?: string | null
  description_care?: string | null
  specs?: string[] | null
  is_new?: boolean
  discount_percent?: number
}

/**
 * MattressModuleService
 *
 * Розширює MedusaService з типізованими методами.
 *
 * Автоматично отримує методи:
 * - createMattressAttributeses(data) - створення (множина - MedusaJS конвенція)
 * - updateMattressAttributeses(data) - оновлення
 * - deleteMattressAttributeses(ids) - видалення
 * - retrieveMattressAttributes(id) - отримання одного запису
 * - listMattressAttributeses(filters, config) - список
 */
class MattressModuleService extends MedusaService({
  MattressAttributes,
}) {
  /**
   * Створює один запис MattressAttributes
   * Обгортка для типізації
   */
  async createMattressAttributes(
    data: CreateMattressAttributesDTO
  ): Promise<MattressAttributesType> {
    // Конвертуємо масиви в формат, який очікує MedusaJS (Record для JSON полів)
    const createData = {
      ...data,
      fillers: data.fillers as unknown as Record<string, unknown>,
      specs: data.specs as unknown as Record<string, unknown>,
    }
    const result = await this.createMattressAttributeses(createData)
    return result
  }

  /**
   * Оновлює один запис MattressAttributes
   * Обгортка для типізації
   */
  async updateMattressAttributes(
    data: UpdateMattressAttributesDTO
  ): Promise<MattressAttributesType> {
    const { id, fillers, specs, ...rest } = data
    const updateData: Record<string, unknown> = { ...rest }

    if (fillers !== undefined) {
      updateData.fillers = fillers as unknown as Record<string, unknown>
    }
    if (specs !== undefined) {
      updateData.specs = specs as unknown as Record<string, unknown>
    }

    const result = await this.updateMattressAttributeses({
      id,
      ...updateData,
    })
    return result
  }

  /**
   * Видаляє один запис MattressAttributes
   * Обгортка для типізації
   */
  async deleteMattressAttributes(id: string): Promise<void> {
    await this.deleteMattressAttributeses([id])
  }
}

export default MattressModuleService
