import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/"
const DELIVERY_AUTO_WAREHOUSES_URL = "https://www.delivery-auto.com/api/v4/Public/GetWarehousesListByCity"
const SAT_API_URL = "https://api.sat.ua/openws/hs/api/v1.0/main/json"

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
 * Пошук відділень через Nova Poshta API
 */
async function fetchNovaPoshtaWarehouses(
  cityRef: string,
  query: string,
  isPostomat: boolean,
  apiKey: string
) {
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
    return result.data.map((wh: any) => ({
      value: wh.Ref,
      label: isPostomat ? `Поштомат ${wh.Number}` : wh.Description,
      address: wh.ShortAddress,
      number: wh.Number,
    }))
  }

  return []
}

/**
 * Пошук відділень через Delivery Auto API (публічний, без ключа)
 */
async function fetchDeliveryAutoWarehouses(cityId: string) {
  const params = new URLSearchParams({
    CityId: cityId,
    DirectionType: "1",
    culture: "uk-UA",
  })

  const response = await fetch(`${DELIVERY_AUTO_WAREHOUSES_URL}?${params}`)
  const result = await response.json()

  if (result.status && result.data) {
    return result.data.map((wh: any) => ({
      value: wh.id,
      label: wh.name,
      address: wh.address || '',
    }))
  }

  return []
}

/**
 * SAT: кеш усіх відділень (276 шт., завантажуються один раз)
 */
let satBranchesCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 }
const SAT_BRANCHES_TTL = 24 * 60 * 60 * 1000 // 24 години

async function fetchSatWarehouses(cityRef: string) {
  // Завантажуємо всі відділення один раз і кешуємо на 24 год
  if (!satBranchesCache.data || Date.now() - satBranchesCache.timestamp > SAT_BRANCHES_TTL) {
    const response = await fetch(`${SAT_API_URL}/getRsp?language=uk`)
    const result = await response.json()

    if (result.success === "true" && result.data) {
      satBranchesCache = { data: result.data, timestamp: Date.now() }
    } else {
      return []
    }
  }

  return satBranchesCache.data!
    .filter((branch: any) => branch.cityRef === cityRef)
    .map((branch: any) => ({
      value: branch.ref,
      label: branch.description,
      address: branch.address || '',
      number: branch.number || '',
    }))
}

/**
 * GET /store/delivery/warehouses?cityRef=xxx&q=search&type=postomat&carrier=nova-poshta
 *
 * Проксі до API перевізників для пошуку відділень.
 * carrier: nova-poshta (default), delivery-auto, cat
 * type=postomat — тільки для Nova Poshta (інші перевізники не мають поштоматів).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cityRef = req.query.cityRef as string
    if (!cityRef) {
      return res.status(400).json({
        success: false,
        error: "cityRef parameter is required",
      })
    }

    const carrier = (req.query.carrier as string || "nova-poshta").trim()
    const query = (req.query.q as string) || ""
    const type = req.query.type as string || ""
    const isPostomat = type === "postomat"

    // Перевіряємо кеш
    const cacheKey = `warehouses:${carrier}:${cityRef}:${query.toLowerCase()}:${type}`
    const cached = getCached(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
    }

    let warehouses: any[] = []

    switch (carrier) {
      case "nova-poshta": {
        const apiKey = process.env.NOVA_POSHTA_API_KEY
        if (!apiKey) {
          return res.status(500).json({
            success: false,
            error: "Nova Poshta API key not configured",
          })
        }
        warehouses = await fetchNovaPoshtaWarehouses(cityRef, query, isPostomat, apiKey)
        break
      }
      case "delivery-auto":
        // Delivery Auto не має поштоматів — ігноруємо type=postomat
        warehouses = await fetchDeliveryAutoWarehouses(cityRef)
        break
      case "cat":
        warehouses = await fetchSatWarehouses(cityRef)
        break
      default:
        return res.json({ success: true, data: [] })
    }

    // Зберігаємо в кеш
    cache.set(cacheKey, { data: warehouses, timestamp: Date.now() })

    return res.json({ success: true, data: warehouses })
  } catch (error: any) {
    console.error("[delivery/warehouses] Error:", error.message)
    return res.status(500).json({
      success: false,
      error: "Failed to fetch warehouses",
    })
  }
}
