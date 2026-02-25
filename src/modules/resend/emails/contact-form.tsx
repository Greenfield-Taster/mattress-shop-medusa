import React from "react"
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
  render,
} from "@react-email/components"

interface ContactFormEmailData {
  name: string
  phone: string
  email: string
  message: string
}

const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const colors = {
  headerBg: "#1e3a5f",
  bodyBg: "#f7faff",
  cardBg: "#ffffff",
  sectionHighlight: "#ebf0f7",
  textPrimary: "#1f2937",
  textSecondary: "#6b7a93",
  border: "#e5e9f0",
}

function ContactFormEmail({ name, phone, email, message }: ContactFormEmailData) {
  return (
    <Html lang="uk">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading as="h1" style={styles.headerTitle}>
              Just Sleep
            </Heading>
            <Text style={styles.headerSubtitle}>
              Нове повідомлення з сайту
            </Text>
          </Section>

          {/* Sender info card */}
          <Section style={styles.card}>
            <Heading as="h2" style={styles.sectionHeading}>
              Дані відправника
            </Heading>

            <Section style={styles.infoRow}>
              <Text style={styles.label}>{"Ім'я:"}</Text>
              <Text style={styles.value}>{name}</Text>
            </Section>

            <Hr style={styles.divider} />

            <Section style={styles.infoRow}>
              <Text style={styles.label}>Телефон:</Text>
              <Text style={styles.value}>
                <Link href={`tel:${phone}`} style={styles.link}>
                  {phone}
                </Link>
              </Text>
            </Section>

            <Hr style={styles.divider} />

            <Section style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>
                <Link href={`mailto:${email}`} style={styles.link}>
                  {email}
                </Link>
              </Text>
            </Section>
          </Section>

          {/* Message section */}
          <Section style={styles.card}>
            <Heading as="h2" style={styles.sectionHeading}>
              Повідомлення
            </Heading>
            <Section style={styles.messageBlock}>
              <Text style={styles.messageText}>{message}</Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Це повідомлення надіслано через форму зворотного зв'язку на сайті
              Just Sleep
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: colors.bodyBg,
    fontFamily,
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px 0",
  },

  // Header
  header: {
    backgroundColor: colors.headerBg,
    borderRadius: "8px 8px 0 0",
    padding: "32px 40px 24px",
    textAlign: "center" as const,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 700,
    fontFamily,
    margin: "0 0 4px",
    letterSpacing: "0.5px",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "15px",
    fontFamily,
    margin: "0",
  },

  // Card
  card: {
    backgroundColor: colors.cardBg,
    borderLeft: `1px solid ${colors.border}`,
    borderRight: `1px solid ${colors.border}`,
    padding: "24px 40px",
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: "18px",
    fontWeight: 600,
    fontFamily,
    margin: "0 0 16px",
  },

  // Info rows
  infoRow: {
    padding: "8px 0",
  },
  label: {
    color: colors.textSecondary,
    fontSize: "13px",
    fontWeight: 600,
    fontFamily,
    margin: "0 0 2px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.3px",
  },
  value: {
    color: colors.textPrimary,
    fontSize: "16px",
    fontFamily,
    margin: "0",
  },
  link: {
    color: colors.headerBg,
    textDecoration: "none",
  },
  divider: {
    borderTop: `1px solid ${colors.border}`,
    borderBottom: "none",
    borderLeft: "none",
    borderRight: "none",
    margin: "4px 0",
  },

  // Message block
  messageBlock: {
    backgroundColor: colors.sectionHighlight,
    borderLeft: `3px solid ${colors.headerBg}`,
    borderRadius: "0 6px 6px 0",
    padding: "16px 20px",
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: "15px",
    fontFamily,
    lineHeight: "1.6",
    margin: "0",
    whiteSpace: "pre-wrap" as const,
  },

  // Footer
  footer: {
    backgroundColor: colors.cardBg,
    borderLeft: `1px solid ${colors.border}`,
    borderRight: `1px solid ${colors.border}`,
    borderBottom: `1px solid ${colors.border}`,
    borderRadius: "0 0 8px 8px",
    padding: "20px 40px",
    textAlign: "center" as const,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: "12px",
    fontFamily,
    margin: "0",
    lineHeight: "1.5",
  },
}

export async function renderContactFormEmail(data: any): Promise<string> {
  return render(
    <ContactFormEmail
      name={data.name || ""}
      phone={data.phone || ""}
      email={data.email || ""}
      message={data.message || ""}
    />
  )
}
