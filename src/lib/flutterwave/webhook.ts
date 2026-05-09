import crypto from 'crypto'

export interface FlutterwaveWebhookPayload {
  event: string
  data: {
    id: number
    tx_ref: string
    flw_ref: string
    device_fingerprint?: string
    amount: number
    currency: string
    charged_amount: number
    app_fee: number
    merchant_fee: number
    processor_response: string
    auth_model?: string
    ip?: string
    narration: string
    status: string
    payment_type: string
    created_at: string
    account_id: number
    customer: {
      id: number
      name: string
      email: string
      phone_number?: string
      created_at: string
    }
    card?: {
      first_6digits: string
      last_4digits: string
      issuer: string
      country: string
      type: string
      token: string
      expiry: string
    }
    meta?: Record<string, unknown>
  }
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_HASH
  if (!secret) {
    console.error('[Flutterwave] FLUTTERWAVE_WEBHOOK_HASH is not set')
    return false
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
