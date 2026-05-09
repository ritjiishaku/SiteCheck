import { verifyWebhookSignature } from '@/lib/flutterwave'
import { handleWebhookEvent } from '@/services/payment.service'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('flw-signature')

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return new Response(JSON.stringify({ error: 'Invalid signature.' }), { status: 401 })
  }

  ;(async () => {
    try {
      const payload = JSON.parse(rawBody)
      const event = payload['event.type'] || payload.event || 'unknown'
      const data = payload.data || {}

      await handleWebhookEvent(event, {
        tx_ref: data.tx_ref,
        transaction_id: String(data.id || ''),
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        customer: data.customer,
        meta: data.meta,
      })
    } catch (err) {
      console.error('[Webhook] Processing error:', err instanceof Error ? err.message : err)
    }
  })()

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
