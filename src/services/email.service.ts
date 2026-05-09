import nodemailer from 'nodemailer'

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

interface SendEmailInput {
  to: string
  subject: string
  text: string
  attachments?: EmailAttachment[]
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

export async function sendReportEmail(input: SendEmailInput): Promise<{ success: boolean; messageId?: string }> {
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

  if (!smtpConfigured) {
    console.log('[EmailService] SMTP not configured. Logging email instead.')
    console.log('[EmailService] To:', input.to)
    console.log('[EmailService] Subject:', input.subject)
    console.log('[EmailService] Attachments:', input.attachments?.length ?? 0)
    return { success: true, messageId: 'simulated' }
  }

  try {
    const info = await transporter.sendMail({
      from: `"SiteCheck" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })

    console.log('[EmailService] Sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error('[EmailService] Failed:', err instanceof Error ? err.message : err)
    return { success: false }
  }
}
