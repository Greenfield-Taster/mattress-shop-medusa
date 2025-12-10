import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Базовий seed для магазину матраців (Україна)
 * 
 * Запуск: npm run seed
 * 
 * Скрипт ідемпотентний - можна запускати повторно без помилок
 */
export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)
  const regionModuleService = container.resolve(Modules.REGION)
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION)
  const apiKeyModuleService = container.resolve(Modules.API_KEY)

  logger.info("=== Seeding Mattress Shop Data ===")

  // ===== STORE =====
  logger.info("Setting up store...")
  const [store] = await storeModuleService.listStores()
  
  // Sales Channel
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    })
    defaultSalesChannel = salesChannelResult
    logger.info("✓ Created Default Sales Channel")
  } else {
    logger.info("• Sales Channel already exists, skipping...")
  }

  // Update store currencies
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: "uah",
            is_default: true,
          },
          {
            currency_code: "eur",
          },
        ],
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  })
  logger.info("✓ Updated store currencies (UAH default)")

  // ===== REGION (Україна) =====
  logger.info("Checking Ukraine region...")
  
  // Отримуємо всі регіони і шукаємо той що має UA
  const allRegions = await regionModuleService.listRegions({}, {
    relations: ["countries"],
  })
  
  let region = allRegions.find(r => 
    r.countries?.some((c: any) => c.iso_2 === "ua" || c.iso_2 === "UA")
  )

  if (region) {
    logger.info("• Ukraine region already exists, skipping...")
  } else {
    try {
      const { result: regionResult } = await createRegionsWorkflow(container).run({
        input: {
          regions: [
            {
              name: "Україна",
              currency_code: "uah",
              countries: ["ua"],
              payment_providers: ["pp_system_default"],
            },
          ],
        },
      })
      region = regionResult[0]
      logger.info("✓ Created Ukraine region")
    } catch (error: any) {
      if (error.message?.includes("already assigned")) {
        // Регіон вже є, знаходимо його
        const regions = await regionModuleService.listRegions({})
        region = regions[0] // Беремо перший доступний
        logger.info("• Region already exists, using existing one")
      } else {
        throw error
      }
    }
  }

  // ===== TAX =====
  logger.info("Setting up tax regions...")
  try {
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: "ua",
          provider_id: "tp_system",
        },
      ],
    })
    logger.info("✓ Created tax region for UA")
  } catch (error: any) {
    // Ігноруємо помилку якщо вже існує
    logger.info("• Tax region already exists or skipped")
  }

  // ===== STOCK LOCATION =====
  logger.info("Checking stock location...")
  
  const existingLocations = await stockLocationModuleService.listStockLocations({
    name: "Склад Київ",
  })

  let stockLocation
  if (existingLocations.length > 0) {
    stockLocation = existingLocations[0]
    logger.info("• Stock location already exists, skipping...")
  } else {
    const { result: stockLocationResult } = await createStockLocationsWorkflow(
      container
    ).run({
      input: {
        locations: [
          {
            name: "Склад Київ",
            address: {
              city: "Київ",
              country_code: "UA",
              address_1: "вул. Складська, 1",
            },
          },
        ],
      },
    })
    stockLocation = stockLocationResult[0]
    logger.info("✓ Created stock location")
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  })

  // Link stock location to fulfillment provider
  try {
    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: "manual_manual",
      },
    })
  } catch (error) {
    // Link might already exist
  }

  // ===== SHIPPING PROFILE =====
  logger.info("Setting up shipping...")
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Стандартна доставка",
              type: "default",
            },
          ],
        },
      })
    shippingProfile = shippingProfileResult[0]
    logger.info("✓ Created shipping profile")
  } else {
    logger.info("• Shipping profile already exists, skipping...")
  }

  // ===== FULFILLMENT SET =====
  const existingFulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({
    name: "Доставка по Україні",
  })

  let fulfillmentSet
  if (existingFulfillmentSets.length > 0) {
    fulfillmentSet = existingFulfillmentSets[0]
    logger.info("• Fulfillment set already exists, skipping...")
  } else {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Доставка по Україні",
      type: "shipping",
      service_zones: [
        {
          name: "Україна",
          geo_zones: [
            {
              country_code: "ua",
              type: "country",
            },
          ],
        },
      ],
    })
    logger.info("✓ Created fulfillment set")

    // Link to stock location
    try {
      await link.create({
        [Modules.STOCK_LOCATION]: {
          stock_location_id: stockLocation.id,
        },
        [Modules.FULFILLMENT]: {
          fulfillment_set_id: fulfillmentSet.id,
        },
      })
    } catch (error) {
      // Already linked
    }
  }

  // ===== SHIPPING OPTIONS =====
  const existingShippingOptions = await fulfillmentModuleService.listShippingOptions({
    name: "Нова Пошта",
  })

  if (existingShippingOptions.length === 0 && fulfillmentSet.service_zones?.[0]?.id) {
    try {
      await createShippingOptionsWorkflow(container).run({
        input: [
          {
            name: "Нова Пошта",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: fulfillmentSet.service_zones[0].id,
            shipping_profile_id: shippingProfile.id,
            type: {
              label: "Нова Пошта",
              description: "Доставка 1-3 дні",
              code: "nova_poshta",
            },
            prices: [
              {
                currency_code: "uah",
                amount: 0,
              },
              {
                region_id: region.id,
                amount: 0,
              },
            ],
            rules: [
              {
                attribute: "enabled_in_store",
                value: "true",
                operator: "eq",
              },
              {
                attribute: "is_return",
                value: "false",
                operator: "eq",
              },
            ],
          },
          {
            name: "Meest Express",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: fulfillmentSet.service_zones[0].id,
            shipping_profile_id: shippingProfile.id,
            type: {
              label: "Meest Express",
              description: "Доставка 2-4 дні",
              code: "meest",
            },
            prices: [
              {
                currency_code: "uah",
                amount: 0,
              },
              {
                region_id: region.id,
                amount: 0,
              },
            ],
            rules: [
              {
                attribute: "enabled_in_store",
                value: "true",
                operator: "eq",
              },
              {
                attribute: "is_return",
                value: "false",
                operator: "eq",
              },
            ],
          },
        ],
      })
      logger.info("✓ Created shipping options (Nova Poshta, Meest)")
    } catch (error: any) {
      logger.info("• Shipping options creation skipped: " + error.message)
    }
  } else {
    logger.info("• Shipping options already exist, skipping...")
  }

  // Link sales channel to stock location
  try {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: stockLocation.id,
        add: [defaultSalesChannel[0].id],
      },
    })
  } catch (error) {
    // Already linked
  }

  // ===== API KEY =====
  logger.info("Checking API key...")
  
  const existingApiKeys = await apiKeyModuleService.listApiKeys({
    title: "Mattress Shop Storefront",
  })

  let publishableApiKey
  if (existingApiKeys.length > 0) {
    publishableApiKey = existingApiKeys[0]
    logger.info("• API key already exists")
  } else {
    const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
      container
    ).run({
      input: {
        api_keys: [
          {
            title: "Mattress Shop Storefront",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    })
    publishableApiKey = publishableApiKeyResult[0]

    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableApiKey.id,
        add: [defaultSalesChannel[0].id],
      },
    })
    logger.info("✓ Created API key")
  }

  logger.info("")
  logger.info("=== Seed completed! ===")
  logger.info(`API Key: ${publishableApiKey.token || "(already created)"}`)
  logger.info("")
  logger.info("Next steps:")
  logger.info("1. Seed mattresses: npx medusa exec ./src/scripts/seed-mattresses.ts")
  logger.info("2. Start server: npm run dev")
  logger.info("3. Open admin: http://localhost:9000/app")
}
