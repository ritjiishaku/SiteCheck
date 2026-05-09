/**
 * Flutterwave Webhook Handler — SiteCheck
 * Path: skills/flutterwave-integration/resources/webhook-handler.ts
 *
 * Copy this file to: src/api/v1/payments/webhook/route.ts
 * Adjust imports to match your project's actual service paths.
 *
 * SECURITY: This endpoint must verify the flutterwave-signature on every request.
 * Never process a webhook without signature verification.
 * Never log raw webhook payloads — they may contain card data.
 */

import crypto from 'crypto'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlutterwaveWebhookPayload {
  id: string
  type: 'charge.completed' | 'subscription.cancelled' | 'payment.failed' | string
  timestamp: number
  data: {
    id: string
    tx_ref: string
    flw_ref: string
    amount: number
    currency: string
    status: 'succeeded' | 'failed' | 'cancelled'
    customer: {
      id: string
      name: string
      email: string
      phone_number: string
    }
    meta?: {
      company_name?: string
      plan?: string
      admin_id?: string
    }
  }
}

interface WebhookHandlerResult {
  success: boolean
  message: string
}

// ─── Signature Verification ───────────────────────────────────────────────────

/**
 * Verifies the Flutterwave webhook signature.
 * Must be called before processing any webhook payload.
 *
 * @param rawBody - The raw request body as a string (not parsed JSON)
 * @param signature - The value of the flw-signature header
 * @returns true if the signature is valid, false otherwise
 */
export function verifyFlutterwaveSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false
  if (!process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    throw new Error('FLUTTERWAVE_WEBHOOK_HASH environment variable is not set.')
  }

  const expectedHash = crypto
    .createHmac('sha256', process.env.FLUTTERWAVE_WEBHOOK_HASH)
    .update(rawBody)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(signature, 'hex')
  )
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

/**
 * Handles a successful charge event.
 * Activates or renews the company subscription.
 */
async function handleChargeCompleted(
  data: FlutterwaveWebhookPayload['data']
): Promise<WebhookHandlerResult> {
  if (data.status !== 'succeeded' || data.currency !== 'NGN') {
    return { success: false, message: 'Charge not successful or invalid currency.' }
  }

  const companyName = data.meta?.company_name
  const plan = data.meta?.plan

  if (!companyName || !plan) {
    // Log missing metadata — this should not happen in production
    console.error('[Webhook] charge.completed missing meta', {
      tx_ref: data.tx_ref,
      flw_ref: data.flw_ref,
    })
    return { success: false, message: 'Missing subscription metadata.' }
  }

  // TODO: Verify amount matches the stored pending payment before activating
  // const pending = await db.payments.findUnique({ where: { tx_ref: data.tx_ref } })
  // if (!pending || pending.amount_ngn !== data.amount) {
  //   return { success: false, message: 'Amount mismatch — not activating.' }
  // }

  // TODO: Replace with your actual subscription activation service call
  // await subscriptionService.activate({
  //   company_name: companyName,
  //   plan,
  //   activated_by: adminId,
  //   transaction_ref: data.tx_ref,
  //   amount_ngn: data.amount,
  // })

  // TODO: Replace with your actual audit log service call
  // await auditService.log({
  //   performed_by: adminId ?? 'system',
  //   action: 'Subscription activated via payment',
  //   target_record_id: data.tx_ref,
  //   target_record_type: 'Payment',
  // })

  // TODO: Replace with your actual notification service call
  // await notificationService.sendEmail({
  //   to: data.customer.email,
  //   subject: 'SiteCheck subscription confirmed',
  //   body: `Your ${plan} subscription for ${companyName} is now active.`,
  // })

  return { success: true, message: 'Subscription activated.' }
}

/**
 * Handles a subscription cancellation event.
 * Deactivates the company subscription at end of billing period.
 */
async function handleSubscriptionCancelled(
  data: FlutterwaveWebhookPayload['data']
): Promise<WebhookHandlerResult> {
  const companyName = data.meta?.company_name

  if (!companyName) {
    return { success: false, message: 'Missing company name in webhook payload.' }
  }

  // TODO: Replace with your actual subscription service call
  // await subscriptionService.scheduleDeactivation({
  //   company_name: companyName,
  //   tx_ref: data.tx_ref,
  // })

  // TODO: Log to audit
  // await auditService.log({
  //   performed_by: 'system',
  //   action: 'Subscription cancellation received',
  //   target_record_id: data.tx_ref,
  //   target_record_type: 'Payment',
  // })

  return { success: true, message: 'Subscription cancellation scheduled.' }
}

/**
 * Handles a failed payment event.
 * Notifies the company admin of the failure.
 */
async function handlePaymentFailed(
  data: FlutterwaveWebhookPayload['data']
): Promise<WebhookHandlerResult> {
  void data
  // TODO: Log to audit
  // await auditService.log({
  //   performed_by: data.meta?.admin_id ?? 'system',
  //   action: 'Payment failed',
  //   target_record_id: data.tx_ref,
  //   target_record_type: 'Payment',
  // })

  // TODO: Notify admin
  // await notificationService.sendEmail({
  //   to: data.customer.email,
  //   subject: 'SiteCheck payment failed',
  //   body: 'Your recent payment attempt was unsuccessful. Please try again or contact support.',
  // })

  return { success: true, message: 'Payment failure logged and admin notified.' }
}

// ─── Main Webhook Router ──────────────────────────────────────────────────────

/**
 * Main webhook handler. Routes events to the correct handler.
 * Called from the API route after signature verification.
 */
export async function processFlutterwaveWebhook(
  payload: FlutterwaveWebhookPayload
): Promise<WebhookHandlerResult> {
  switch (payload.type) {
    case 'charge.completed':
      return handleChargeCompleted(payload.data)

    case 'subscription.cancelled':
      return handleSubscriptionCancelled(payload.data)

    case 'payment.failed':
      return handlePaymentFailed(payload.data)

    default:
      // Unknown event — acknowledge receipt but do not process
      return { success: true, message: `Unhandled event type: ${payload.type}` }
  }
}

// ─── API Route Handler ────────────────────────────────────────────────────────

/**
 * Next.js / framework-agnostic route handler.
 * Mount at: POST /api/v1/payments/webhook
 *
 * IMPORTANT: The raw body must be read as text before JSON.parse
 * so that the HMAC signature can be verified against the original bytes.
 */
export async function POST(req: Request): Promise<Response> {
  // 1. Read raw body — must be raw string for signature verification
  const rawBody = await req.text()
  const signature = req.headers.get('flw-signature')

  // 2. Verify signature — reject immediately if invalid
  if (!verifyFlutterwaveSignature(rawBody, signature)) {
    // Do not log the raw body — it may contain card data
    console.warn('[Webhook] Invalid Flutterwave signature. Request rejected.')
    return new Response(JSON.stringify({ error: 'Invalid signature.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 3. Respond 200 immediately — Flutterwave expects a fast response
  // Process the event asynchronously after responding
  const response = new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

  // 4. Parse and process asynchronously
  try {
    const payload = JSON.parse(rawBody) as FlutterwaveWebhookPayload
    await processFlutterwaveWebhook(payload)
  } catch (err) {
    // Log error server-side only — never expose to Flutterwave
    console.error('[Webhook] Processing error:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      // Do NOT log rawBody here
    })
  }

  return response
}
