import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/"
const DELIVERY_AUTO_API_URL = "https://www.delivery-auto.com/api/v4/Public/GetAreasList"
const SAT_API_URL = "https://api.sat.ua/openws/hs/api/v1.0/main/json"

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
 * Пошук міст через Nova Poshta API
 */
async function fetchNovaPoshtaCities(query: string) {
  const apiKey = process.env.NOVA_POSHTA_API_KEY
  if (!apiKey) {
    throw new Error("Nova Poshta API key not configured")
  }

  const response = await fetch(NOVA_POSHTA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      modelName: "Address",
      calledMethod: "getCities",
      methodProperties: {
        FindByString: query,
        Limit: 50,
      },
    }),
  })

  const result = await response.json()

  if (result.success && result.data) {
    return result.data.map((city: any) => ({
      value: city.Ref,
      label: city.Description,
      area: city.AreaDescription ? `${city.AreaDescription} область` : '',
    }))
  }

  return []
}

/**
 * Пошук міст через Delivery Auto API (публічний, без ключа)
 */
async function fetchDeliveryAutoCities(query: string) {
  const params = new URLSearchParams({
    culture: "uk-UA",
    country: "1",
    cityName: query,
  })

  const response = await fetch(`${DELIVERY_AUTO_API_URL}?${params}`)
  const result = await response.json()

  if (result.status && result.data) {
    return result.data.map((city: any) => ({
      value: city.id,
      label: city.name,
      area: city.regionName || '',
    }))
  }

  return []
}

/**
 * Пошук міст через SAT API (публічний, без ключа для довідникових запитів)
 */
async function fetchSatCities(query: string) {
  const params = new URLSearchParams({
    searchString: query,
    language: "uk",
  })

  const response = await fetch(`${SAT_API_URL}/getTowns?${params}`)
  const result = await response.json()

  if (result.success === "true" && result.data) {
    return result.data
      .filter((city: any) => city.services && city.services.length > 0)
      .map((city: any) => ({
        value: city.ref,
        label: city.description,
        area: city.region || '',
      }))
  }

  return []
}

/**
 * GET /store/delivery/cities?q=Київ&carrier=nova-poshta
 *
 * Проксі до API перевізників для пошуку міст.
 * carrier: nova-poshta (default), delivery-auto, cat
 * Інші перевізники (meest, ukrposhta) повертають порожній масив.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = (req.query.q as string || "").trim()
    if (!query) {
      return res.json({ success: true, data: [] })
    }

    const carrier = (req.query.carrier as string || "nova-poshta").trim()

    // Перевіряємо кеш
    const cacheKey = `cities:${carrier}:${query.toLowerCase()}`
    const cached = getCached(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
    }

    let cities: any[] = []

    switch (carrier) {
      case "nova-poshta":
        cities = await fetchNovaPoshtaCities(query)
        break
      case "delivery-auto":
        cities = await fetchDeliveryAutoCities(query)
        break
      case "cat":
        cities = await fetchSatCities(query)
        break
      default:
        return res.json({ success: true, data: [] })
    }

    // Зберігаємо в кеш
    cache.set(cacheKey, { data: cities, timestamp: Date.now() })

    return res.json({ success: true, data: cities })
  } catch (error: any) {
    console.error("[delivery/cities] Error:", error.message)
    return res.status(500).json({
      success: false,
      error: "Failed to fetch cities",
    })
  }
}
