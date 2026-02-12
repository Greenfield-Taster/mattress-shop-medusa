import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/"

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
 * GET /store/delivery/cities?q=Київ
 *
 * Проксі до Nova Poshta API getCities.
 * API ключ зберігається на сервері, не потрапляє в фронтенд бандл.
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

    const query = (req.query.q as string || "").trim()
    if (!query) {
      return res.json({ success: true, data: [] })
    }

    // Перевіряємо кеш
    const cacheKey = `cities:${query.toLowerCase()}`
    const cached = getCached(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
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
      const cities = result.data.map((city: any) => ({
        value: city.Ref,
        label: city.Description,
        area: city.AreaDescription,
      }))

      // Зберігаємо в кеш
      cache.set(cacheKey, { data: cities, timestamp: Date.now() })

      return res.json({ success: true, data: cities })
    }

    return res.json({ success: false, data: [], errors: result.errors })
  } catch (error: any) {
    console.error("[delivery/cities] Error:", error.message)
    return res.status(500).json({
      success: false,
      error: "Failed to fetch cities",
    })
  }
}
