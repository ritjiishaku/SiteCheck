const BASE_URL = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3'

function getSecretKey(): string {
  const key = process.env.FLUTTERWAVE_SECRET_KEY
  if (!key) throw new Error('FLUTTERWAVE_SECRET_KEY is not set')
  return key
}

function getPublicKey(): string {
  const key = process.env.FLUTTERWAVE_PUBLIC_KEY
  if (!key) throw new Error('FLUTTERWAVE_PUBLIC_KEY is not set')
  return key
}

export interface InitiatePaymentParams {
  tx_ref: string
  amount: number
  currency?: string
  redirect_url: string
  customer: { email: string; name?: string; phone_number?: string }
  customizations?: { title: string; description?: string; logo?: string }
  meta?: Record<string, unknown>
}

export interface FlutterwaveResponse {
  status: 'success' | 'error'
  message: string
  data: {
    link?: string
    id?: number
    tx_ref?: string
    amount?: number
    currency?: string
    status?: string
    customer?: { email: string }
  }
}

export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<FlutterwaveResponse> {
  const response = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: params.tx_ref,
      amount: params.amount,
      currency: params.currency || 'NGN',
      redirect_url: params.redirect_url,
      customer: params.customer,
      customizations: params.customizations,
      meta: params.meta,
    }),
  })
  return response.json()
}

export async function verifyTransaction(
  transactionId: string
): Promise<FlutterwaveResponse> {
  const response = await fetch(
    `${BASE_URL}/transactions/${transactionId}/verify`,
    {
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        'Content-Type': 'application/json',
      },
    }
  )
  return response.json()
}

export async function getTransactionByTxRef(
  txRef: string
): Promise<FlutterwaveResponse> {
  const response = await fetch(
    `${BASE_URL}/transactions?tx_ref=${encodeURIComponent(txRef)}`,
    {
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        'Content-Type': 'application/json',
      },
    }
  )
  return response.json()
}

export function getPublicKeyValue(): string {
  return getPublicKey()
}
