import { verifyWebhookSignature } from '@/lib/flutterwave'
import { handleWebhookEvent } from '@/services/payment.service'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('flw-signature')

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return new Response(JSON.stringify({ error: 'Invalid signature.' }), { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const event = payload['event.type'] || payload.event || 'unknown'
  const data = payload.data || {}
  const transactionId = String(data.id || '')

  if (transactionId) {
    const existing = await prisma.paymentEvent.findFirst({ where: { transaction_id: transactionId } })
    if (existing) return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  await handleWebhookEvent(event, {
    tx_ref: data.tx_ref,
    transaction_id: transactionId,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    customer: data.customer,
    meta: data.meta,
  })

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
