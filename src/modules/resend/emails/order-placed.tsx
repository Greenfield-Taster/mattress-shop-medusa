import React from "react"
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Heading,
  Hr,
  render,
} from "@react-email/components"

interface OrderEmailData {
  order_number: string
  full_name: string
  email: string
  items: Array<{
    title: string
    size: string | null
    quantity: number
    unit_price: number
    total: number
  }>
  subtotal: number
  discount_amount: number
  delivery_price: number
  delivery_price_type: string
  total: number
  delivery_method: string
  delivery_city: string | null
  delivery_warehouse: string | null
  delivery_address: string | null
  payment_method: string
  promo_code: string | null
}

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

const COLORS = {
  headerBg: "#1e3a5f",
  bodyBg: "#f7faff",
  cardBg: "#ffffff",
  sectionHighlight: "#ebf0f7",
  textPrimary: "#1f2937",
  textSecondary: "#6b7a93",
  border: "#e5e9f0",
  accent: "#1e3a5f",
  footerBg: "#f0f2f5",
}

const DELIVERY_LABELS: Record<string, string> = {
  "nova-poshta": "Нова Пошта",
  delivery: "Delivery",
  cat: "SAT",
  courier: "Кур'єр (Київ)",
  pickup: "Самовивіз",
}

const PAYMENT_LABELS: Record<string, string> = {
  "cash-on-delivery": "Оплата при отриманні",
  "card-online": "Картка онлайн",
  "google-apple-pay": "Google Pay / Apple Pay",
  invoice: "Рахунок для юридичних осіб",
}

function formatCurrency(kopecks: number): string {
  return (kopecks / 100).toLocaleString("uk-UA") + " ₴"
}

function getDeliveryDestination(data: OrderEmailData): string {
  const method = data.delivery_method

  if (method === "pickup") {
    return "м. Київ, вул. Прикладна, 1"
  }

  if (method === "courier") {
    const parts: string[] = []
    if (data.delivery_city) parts.push(data.delivery_city)
    if (data.delivery_address) parts.push(data.delivery_address)
    return parts.join(", ") || ""
  }

  const parts: string[] = []
  if (data.delivery_city) parts.push(data.delivery_city)
  if (data.delivery_warehouse) parts.push(data.delivery_warehouse)
  return parts.join(", ") || ""
}

function getDeliveryPriceLabel(data: OrderEmailData): string {
  if (data.delivery_price_type === "free" || data.delivery_price === 0) {
    return "Безкоштовно"
  }
  if (data.delivery_price_type === "carrier") {
    return "За тарифами перевізника"
  }
  return formatCurrency(data.delivery_price)
}

function OrderPlacedEmail({ data }: { data: OrderEmailData }) {
  const deliveryLabel =
    DELIVERY_LABELS[data.delivery_method] || data.delivery_method
  const paymentLabel =
    PAYMENT_LABELS[data.payment_method] || data.payment_method
  const destination = getDeliveryDestination(data)

  return (
    <Html lang="uk">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{`Замовлення #${data.order_number} — Just Sleep`}</title>
      </Head>
      <Body
        style={{
          backgroundColor: COLORS.bodyBg,
          fontFamily: FONT_FAMILY,
          margin: 0,
          padding: 0,
          WebkitTextSizeAdjust: "100%",
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: COLORS.cardBg,
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* ── Header ── */}
          <Section
            style={{
              backgroundColor: COLORS.headerBg,
              padding: "28px 40px",
              textAlign: "center" as const,
            }}
          >
            <Heading
              as="h1"
              style={{
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: 700,
                margin: 0,
                letterSpacing: "0.5px",
                fontFamily: FONT_FAMILY,
              }}
            >
              Just Sleep
            </Heading>
          </Section>

          {/* ── Greeting ── */}
          <Section style={{ padding: "32px 40px 8px" }}>
            <Heading
              as="h2"
              style={{
                color: COLORS.textPrimary,
                fontSize: "20px",
                fontWeight: 600,
                margin: "0 0 12px",
                fontFamily: FONT_FAMILY,
              }}
            >
              Дякуємо за замовлення, {data.full_name}!
            </Heading>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: "15px",
                lineHeight: "24px",
                margin: 0,
              }}
            >
              Ваше замовлення{" "}
              <strong style={{ color: COLORS.accent }}>
                #{data.order_number}
              </strong>{" "}
              прийнято та обробляється.
            </Text>
          </Section>

          {/* ── Items ── */}
          <Section style={{ padding: "24px 40px 0" }}>
            <Heading
              as="h3"
              style={{
                color: COLORS.textPrimary,
                fontSize: "16px",
                fontWeight: 600,
                margin: "0 0 16px",
                fontFamily: FONT_FAMILY,
                textTransform: "uppercase" as const,
                letterSpacing: "0.5px",
              }}
            >
              Товари
            </Heading>

            {data.items.map((item, index) => (
              <React.Fragment key={index}>
                <Row
                  style={{
                    padding: "12px 0",
                  }}
                >
                  <Column style={{ width: "65%", verticalAlign: "top" }}>
                    <Text
                      style={{
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        lineHeight: "20px",
                        margin: 0,
                        fontWeight: 500,
                      }}
                    >
                      {item.title}
                    </Text>
                    {item.size && (
                      <Text
                        style={{
                          color: COLORS.textSecondary,
                          fontSize: "13px",
                          lineHeight: "18px",
                          margin: "2px 0 0",
                        }}
                      >
                        Розмір: {item.size}
                      </Text>
                    )}
                  </Column>
                  <Column
                    style={{
                      width: "35%",
                      textAlign: "right" as const,
                      verticalAlign: "top",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.textPrimary,
                        fontSize: "14px",
                        lineHeight: "20px",
                        margin: 0,
                      }}
                    >
                      {item.quantity} &times; {formatCurrency(item.unit_price)}
                    </Text>
                    {item.quantity > 1 && (
                      <Text
                        style={{
                          color: COLORS.textSecondary,
                          fontSize: "13px",
                          lineHeight: "18px",
                          margin: "2px 0 0",
                        }}
                      >
                        {formatCurrency(item.total)}
                      </Text>
                    )}
                  </Column>
                </Row>
                {index < data.items.length - 1 && (
                  <Hr
                    style={{
                      borderColor: COLORS.border,
                      borderWidth: "1px 0 0 0",
                      margin: 0,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </Section>

          {/* ── Totals ── */}
          <Section
            style={{
              backgroundColor: COLORS.sectionHighlight,
              padding: "20px 40px",
              margin: "24px 0 0",
            }}
          >
            {/* Subtotal */}
            <Row style={{ padding: "4px 0" }}>
              <Column style={{ width: "60%" }}>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Підсумок
                </Text>
              </Column>
              <Column style={{ width: "40%", textAlign: "right" as const }}>
                <Text
                  style={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  {formatCurrency(data.subtotal)}
                </Text>
              </Column>
            </Row>

            {/* Discount (only if > 0) */}
            {data.discount_amount > 0 && (
              <Row style={{ padding: "4px 0" }}>
                <Column style={{ width: "60%" }}>
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: "14px",
                      margin: 0,
                    }}
                  >
                    Знижка
                    {data.promo_code && (
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#dbeafe",
                          color: COLORS.accent,
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: "4px",
                          marginLeft: "6px",
                          verticalAlign: "middle",
                          letterSpacing: "0.3px",
                        }}
                      >
                        {data.promo_code}
                      </span>
                    )}
                  </Text>
                </Column>
                <Column style={{ width: "40%", textAlign: "right" as const }}>
                  <Text
                    style={{
                      color: "#16a34a",
                      fontSize: "14px",
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    -{formatCurrency(data.discount_amount)}
                  </Text>
                </Column>
              </Row>
            )}

            {/* Delivery */}
            <Row style={{ padding: "4px 0" }}>
              <Column style={{ width: "60%" }}>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Доставка
                </Text>
              </Column>
              <Column style={{ width: "40%", textAlign: "right" as const }}>
                <Text
                  style={{
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  {getDeliveryPriceLabel(data)}
                </Text>
              </Column>
            </Row>

            {/* Total */}
            <Hr
              style={{
                borderColor: COLORS.border,
                borderWidth: "1px 0 0 0",
                margin: "12px 0",
              }}
            />
            <Row style={{ padding: "4px 0" }}>
              <Column style={{ width: "60%" }}>
                <Text
                  style={{
                    color: COLORS.textPrimary,
                    fontSize: "18px",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Разом
                </Text>
              </Column>
              <Column style={{ width: "40%", textAlign: "right" as const }}>
                <Text
                  style={{
                    color: COLORS.accent,
                    fontSize: "18px",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {formatCurrency(data.total)}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* ── Delivery Info ── */}
          <Section style={{ padding: "24px 40px 0" }}>
            <Heading
              as="h3"
              style={{
                color: COLORS.textPrimary,
                fontSize: "16px",
                fontWeight: 600,
                margin: "0 0 12px",
                fontFamily: FONT_FAMILY,
                textTransform: "uppercase" as const,
                letterSpacing: "0.5px",
              }}
            >
              Доставка
            </Heading>
            <Text
              style={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                lineHeight: "22px",
                margin: "0 0 4px",
                fontWeight: 500,
              }}
            >
              {deliveryLabel}
            </Text>
            {destination && (
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: "14px",
                  lineHeight: "22px",
                  margin: 0,
                }}
              >
                {destination}
              </Text>
            )}
          </Section>

          {/* ── Payment Info ── */}
          <Section style={{ padding: "20px 40px 0" }}>
            <Heading
              as="h3"
              style={{
                color: COLORS.textPrimary,
                fontSize: "16px",
                fontWeight: 600,
                margin: "0 0 12px",
                fontFamily: FONT_FAMILY,
                textTransform: "uppercase" as const,
                letterSpacing: "0.5px",
              }}
            >
              Оплата
            </Heading>
            <Text
              style={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                lineHeight: "22px",
                margin: 0,
                fontWeight: 500,
              }}
            >
              {paymentLabel}
            </Text>
          </Section>

          {/* ── Spacer before footer ── */}
          <Section style={{ padding: "16px 0" }} />

          {/* ── Footer ── */}
          <Section
            style={{
              backgroundColor: COLORS.footerBg,
              padding: "24px 40px",
              textAlign: "center" as const,
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <Text
              style={{
                color: COLORS.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                margin: "0 0 8px",
              }}
            >
              Just Sleep
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: "13px",
                lineHeight: "20px",
                margin: 0,
              }}
            >
              +380501234567 &nbsp;&bull;&nbsp; info@just-sleep.com.ua
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: "11px",
                lineHeight: "18px",
                margin: "12px 0 0",
              }}
            >
              Цей лист надіслано автоматично. Будь ласка, не відповідайте на
              нього.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderOrderPlacedEmail(data: any): Promise<string> {
  return render(<OrderPlacedEmail data={data as OrderEmailData} />)
}
