interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface NotificationData {
  user: { name: string; email: string }
  project?: { name: string; id: string }
  client?: { name: string }
  quotation?: { total: number; items: number }
  [key: string]: any
}

class EmailService {
  private templates: Record<string, (data: NotificationData) => EmailTemplate> = {
    projectCreated: (data) => ({
      subject: `New Project Created: ${data.project?.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Project Created</h2>
          <p>Hello ${data.user.name},</p>
          <p>A new project has been created:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${data.project?.name}</h3>
            <p style="margin: 0;"><strong>Client:</strong> ${data.client?.name}</p>
          </div>
          <p>You can view and manage this project in your dashboard.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Project
          </a>
        </div>
      `,
      text: `New Project Created: ${data.project?.name}\n\nClient: ${data.client?.name}\n\nView at: ${process.env.NEXT_PUBLIC_APP_URL}/projects`,
    }),

    quotationReady: (data) => ({
      subject: `Quotation Ready: ${data.project?.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Quotation Ready</h2>
          <p>Hello ${data.user.name},</p>
          <p>The quotation for your project is ready:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${data.project?.name}</h3>
            <p style="margin: 5px 0;"><strong>Client:</strong> ${data.client?.name}</p>
            <p style="margin: 5px 0;"><strong>Total Value:</strong> $${data.quotation?.total.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Items Matched:</strong> ${data.quotation?.items}</p>
          </div>
          <p>You can review and export the quotation from your project dashboard.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Quotation
          </a>
        </div>
      `,
      text: `Quotation Ready: ${data.project?.name}\n\nTotal: $${data.quotation?.total.toLocaleString()}\nItems: ${data.quotation?.items}\n\nView at: ${process.env.NEXT_PUBLIC_APP_URL}/projects`,
    }),

    priceMatchingComplete: (data) => ({
      subject: `Price Matching Complete: ${data.project?.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Price Matching Complete</h2>
          <p>Hello ${data.user.name},</p>
          <p>Price matching has been completed for your project:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${data.project?.name}</h3>
            <p style="margin: 5px 0;"><strong>Items Processed:</strong> ${data.itemsProcessed}</p>
            <p style="margin: 5px 0;"><strong>Success Rate:</strong> ${data.successRate}%</p>
            <p style="margin: 5px 0;"><strong>Average Confidence:</strong> ${data.averageConfidence}%</p>
          </div>
          <p>Review the results and create your quotation.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" 
             style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Results
          </a>
        </div>
      `,
      text: `Price Matching Complete: ${data.project?.name}\n\nItems: ${data.itemsProcessed}\nSuccess Rate: ${data.successRate}%\n\nView at: ${process.env.NEXT_PUBLIC_APP_URL}/projects`,
    }),

    systemAlert: (data) => ({
      subject: `System Alert: ${data.alertType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">System Alert</h2>
          <p>Hello ${data.user.name},</p>
          <p>A system alert has been triggered:</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626;">${data.alertType}</h3>
            <p style="margin: 0;">${data.message}</p>
          </div>
          <p>Please check your system dashboard for more details.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/system" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </div>
      `,
      text: `System Alert: ${data.alertType}\n\n${data.message}\n\nView at: ${process.env.NEXT_PUBLIC_APP_URL}/system`,
    }),
  }

  async sendEmail(templateName: string, to: string, data: NotificationData): Promise<boolean> {
    try {
      const template = this.templates[templateName]
      if (!template) {
        throw new Error(`Template ${templateName} not found`)
      }

      const emailContent = template(data)

      // In a real implementation, you would use a service like SendGrid, AWS SES, or Nodemailer
      // For now, we'll simulate the email sending
      console.log("Sending email:", {
        to,
        subject: emailContent.subject,
        html: emailContent.html,
      })

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return true
    } catch (error) {
      console.error("Failed to send email:", error)
      return false
    }
  }

  async sendBulkEmail(templateName: string, recipients: string[], data: NotificationData): Promise<number> {
    let successCount = 0

    for (const recipient of recipients) {
      const success = await this.sendEmail(templateName, recipient, data)
      if (success) successCount++
    }

    return successCount
  }
}

export const emailService = new EmailService()
