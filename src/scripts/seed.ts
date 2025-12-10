import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types"
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
 */
export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)

  logger.info("=== Seeding Mattress Shop Data ===")

  // ===== STORE =====
  logger.info("Setting up store...")
  const [store] = await storeModuleService.listStores()
  
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
  }

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

  // ===== REGION (Україна) =====
  logger.info("Creating Ukraine region...")
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
  const region = regionResult[0]

  // ===== TAX =====
  logger.info("Setting up tax regions...")
  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "ua",
        provider_id: "tp_system",
      },
    ],
  })

  // ===== STOCK LOCATION =====
  logger.info("Creating stock location...")
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
  const stockLocation = stockLocationResult[0]

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  })

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
  }

  // ===== FULFILLMENT SET =====
  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
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

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  // ===== SHIPPING OPTIONS =====
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
            amount: 0, // Безкоштовна доставка
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

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  })

  // ===== API KEY =====
  logger.info("Creating API key...")
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
  const publishableApiKey = publishableApiKeyResult[0]

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  })

  logger.info("=== Seed completed! ===")
  logger.info(`API Key: ${publishableApiKey.token}`)
  logger.info("")
  logger.info("Next steps:")
  logger.info("1. Run migrations: npx medusa db:migrate")
  logger.info("2. Seed mattresses: npx medusa exec ./src/scripts/seed-mattresses.ts")
  logger.info("3. Start server: npm run dev")
}
