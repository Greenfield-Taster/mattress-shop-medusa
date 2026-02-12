import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/"

// Ref поштоматів у Nova Poshta API
const POSTOMAT_TYPE_REF = "9a68df70-0267-42a8-bb5c-37f427e36ee4"

// In-memory кеш: ключ → { data, timestamp }
const cache = new Map<string, { data: any[]; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 хвилин

function getCached(key: string) {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data
  }
  cache.delete(key)
  return null
}

/**
 * GET /store/delivery/warehouses?cityRef=xxx&q=search&type=postomat
 *
 * Проксі до Nova Poshta API getWarehouses.
 * type=postomat — повертає тільки поштомати.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const apiKey = process.env.NOVA_POSHTA_API_KEY
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Nova Poshta API key not configured",
      })
    }

    const cityRef = req.query.cityRef as string
    if (!cityRef) {
      return res.status(400).json({
        success: false,
        error: "cityRef parameter is required",
      })
    }

    const query = (req.query.q as string) || ""
    const type = req.query.type as string || ""
    const isPostomat = type === "postomat"

    // Перевіряємо кеш
    const cacheKey = `warehouses:${cityRef}:${query.toLowerCase()}:${type}`
    const cached = getCached(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
    }

    const methodProperties: Record<string, any> = {
      CityRef: cityRef,
      Limit: 50,
    }

    if (query) {
      methodProperties.FindByString = query
    }

    if (isPostomat) {
      methodProperties.TypeOfWarehouseRef = POSTOMAT_TYPE_REF
    }

    const response = await fetch(NOVA_POSHTA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        modelName: "Address",
        calledMethod: "getWarehouses",
        methodProperties,
      }),
    })

    const result = await response.json()

    if (result.data) {
      const warehouses = result.data.map((wh: any) => ({
        value: wh.Ref,
        label: isPostomat ? `Поштомат ${wh.Number}` : wh.Description,
        address: wh.ShortAddress,
        number: wh.Number,
      }))

      // Зберігаємо в кеш
      cache.set(cacheKey, { data: warehouses, timestamp: Date.now() })

      return res.json({ success: true, data: warehouses })
    }

    return res.json({ success: false, data: [], errors: result.errors })
  } catch (error: any) {
    console.error("[delivery/warehouses] Error:", error.message)
    return res.status(500).json({
      success: false,
      error: "Failed to fetch warehouses",
    })
  }
}
