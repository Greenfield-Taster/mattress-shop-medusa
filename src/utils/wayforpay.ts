import crypto from "crypto"

const MERCHANT_ACCOUNT = process.env.WAYFORPAY_MERCHANT_ACCOUNT || ""
const MERCHANT_SECRET = process.env.WAYFORPAY_MERCHANT_SECRET || ""
const MERCHANT_DOMAIN = process.env.WAYFORPAY_MERCHANT_DOMAIN || "just-sleep.com.ua"

interface PaymentDataParams {
  orderReference: string
  orderDate: number
  amount: number
  currency: string
  productNames: string[]
  productCounts: number[]
  productPrices: number[]
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone: string
  serviceUrl?: string
}

export interface WidgetPaymentData {
  merchantAccount: string
  merchantDomainName: string
  merchantSignature: string
  merchantTransactionSecureType: string
  orderReference: string
  orderDate: number
  amount: number
  currency: string
  productName: string[]
  productPrice: number[]
  productCount: number[]
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  clientPhone: string
  language: string
  paymentSystems: string
  straightWidget: boolean
  serviceUrl?: string
}

export interface WebhookBody {
  merchantAccount: string
  orderReference: string
  merchantSignature: string
  amount: number
  currency: string
  authCode: string
  cardPan: string
  transactionStatus: string
  reasonCode: number
  reason: string
  email?: string
  phone?: string
  createdDate?: number
  processingDate?: number
  cardType?: string
  issuerBankName?: string
  fee?: number
  paymentSystem?: string
}

function calculateSignature(parts: (string | number)[]): string {
  const signatureString = parts.join(";")
  return crypto
    .createHmac("md5", MERCHANT_SECRET)
    .update(signatureString, "utf8")
    .digest("hex")
}

export function buildPaymentData(params: PaymentDataParams): WidgetPaymentData {
  const signatureParts: (string | number)[] = [
    MERCHANT_ACCOUNT,
    MERCHANT_DOMAIN,
    params.orderReference,
    params.orderDate,
    params.amount,
    params.currency,
    ...params.productNames,
    ...params.productCounts,
    ...params.productPrices,
  ]

  return {
    merchantAccount: MERCHANT_ACCOUNT,
    merchantDomainName: MERCHANT_DOMAIN,
    merchantSignature: calculateSignature(signatureParts),
    merchantTransactionSecureType: "AUTO",
    orderReference: params.orderReference,
    orderDate: params.orderDate,
    amount: params.amount,
    currency: params.currency,
    productName: params.productNames,
    productPrice: params.productPrices,
    productCount: params.productCounts,
    clientFirstName: params.clientFirstName,
    clientLastName: params.clientLastName,
    clientEmail: params.clientEmail,
    clientPhone: params.clientPhone,
    language: "UA",
    paymentSystems: "card;googlePay;applePay",
    straightWidget: true,
    ...(params.serviceUrl ? { serviceUrl: params.serviceUrl } : {}),
  }
}

export function verifyWebhookSignature(body: WebhookBody): boolean {
  const signatureParts: (string | number)[] = [
    body.merchantAccount,
    body.orderReference,
    body.amount,
    body.currency,
    body.authCode,
    body.cardPan,
    body.transactionStatus,
    body.reasonCode,
  ]

  const expected = calculateSignature(signatureParts)
  return expected === body.merchantSignature
}

export function buildWebhookResponse(orderReference: string): {
  orderReference: string
  status: string
  time: number
  signature: string
} {
  const time = Math.floor(Date.now() / 1000)
  const status = "accept"

  const signatureParts: (string | number)[] = [orderReference, status, time]
  const signature = calculateSignature(signatureParts)

  return { orderReference, status, time, signature }
}
