import { MedusaService } from "@medusajs/framework/utils"
import MattressAttributes from "./models/mattress-attributes"

/**
 * MattressModuleService
 * 
 * Автоматично отримує методи:
 * - createMattressAttributes(data)
 * - updateMattressAttributes(data)
 * - deleteMattressAttributes(id)
 * - retrieveMattressAttributes(id)
 * - listMattressAttributes(filters, config)
 */
class MattressModuleService extends MedusaService({
  MattressAttributes,
}) {}

export default MattressModuleService
