import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"
import { Resend } from "resend"
import { renderOrderPlacedEmail } from "./emails/order-placed"
import { renderContactFormEmail } from "./emails/contact-form"

type ResendOptions = {
  api_key: string
  from: string
}

type InjectedDependencies = {
  logger: Logger
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "resend"
  private resendClient: Resend
  private options: ResendOptions
  private logger: Logger

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.resendClient = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.api_key) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Resend api_key is required")
    }
    if (!options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Resend from email is required")
    }
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const { template, to, data } = notification

    let subject: string
    let html: string

    const templateData = data as Record<string, any> ?? {}

    switch (template) {
      case "order-placed": {
        subject = `Замовлення #${templateData.order_number} — Just Sleep`
        html = await renderOrderPlacedEmail(templateData)
        break
      }
      case "contact-form": {
        subject = `Нове повідомлення від ${templateData.name} — Just Sleep`
        html = await renderContactFormEmail(templateData)
        break
      }
      default:
        this.logger.warn(`[resend] Unknown email template: ${template}`)
        return {}
    }

    try {
      const result = await this.resendClient.emails.send({
        from: this.options.from,
        to: [to],
        subject,
        html,
      })

      if (result.error) {
        this.logger.error(`[resend] Failed to send email: ${result.error.message}`)
        return {}
      }

      return { id: result.data?.id }
    } catch (error: any) {
      this.logger.error(`[resend] Error sending email: ${error.message}`)
      return {}
    }
  }
}

export default ResendNotificationProviderService
