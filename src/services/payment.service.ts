import { prisma } from '@/lib/db'
import { initiatePayment, verifyTransaction } from '@/lib/flutterwave'
import type { InitiatePaymentInput, ServiceResult } from '@/types'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

export async function initiateSubscriptionPayment(
  input: InitiatePaymentInput
): Promise<ServiceResult<{ payment_link: string; tx_ref: string }>> {
  try {
    const tx_ref = `sitecheck-${input.company_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

    const existing = await prisma.subscription.findUnique({
      where: { company_name: input.company_name },
    })

    const redirect_url = `${APP_URL}/api/v1/payments/callback`

    const response = await initiatePayment({
      tx_ref,
      amount: input.amount_ngn,
      currency: 'NGN',
      redirect_url,
      customer: {
        email: input.email,
        name: input.company_name,
      },
      customizations: {
        title: 'SiteCheck',
        description: `${input.plan} subscription - ${input.company_name}`,
      },
      meta: {
        company_name: input.company_name,
        plan: input.plan,
        admin_id: input.admin_id,
      },
    })

    if (response.status !== 'success' || !response.data?.link) {
      return {
        success: false,
        error: 'Payment could not be initiated. Please try again.',
        code: 'PAYMENT_INIT_FAILED',
      }
    }

    if (existing) {
      await prisma.subscription.update({
        where: { company_name: input.company_name },
        data: {
          plan: input.plan,
          status: 'Inactive',
          flutterwave_tx_ref: tx_ref,
          amount_paid: input.amount_ngn,
        },
      })
    } else {
      await prisma.subscription.create({
        data: {
          company_name: input.company_name,
          plan: input.plan,
          status: 'Inactive',
          flutterwave_tx_ref: tx_ref,
          amount_paid: input.amount_ngn,
        },
      })
    }

    await prisma.paymentEvent.create({
      data: {
        company_name: input.company_name,
        event_type: 'payment.initiated',
        tx_ref,
        amount: input.amount_ngn,
        currency: 'NGN',
        status: 'pending',
        customer_email: input.email,
        meta: { plan: input.plan },
      },
    })

    return { success: true, data: { payment_link: response.data.link, tx_ref } }
  } catch (err) {
    console.error('[PaymentService] initiate failed:', err instanceof Error ? err.message : err)
    return { success: false, error: 'Payment could not be initiated.', code: 'PAYMENT_INIT_FAILED' }
  }
}

function getPlanDurationDays(plan: string): number {
  switch (plan.toLowerCase()) {
    case 'monthly':
      return 30
    case 'annual':
    case 'yearly':
      return 365
    case 'quarterly':
      return 90
    default:
      return 30
  }
}

export async function verifyAndActivateSubscription(
  tx_ref: string,
  transaction_id: string
): Promise<ServiceResult<{ company_name: string; status: string }>> {
  try {
    const verification = await verifyTransaction(transaction_id)

    if (verification.status !== 'success') {
      return {
        success: false,
        error: 'Transaction verification failed.',
        code: 'TX_VERIFY_FAILED',
      }
    }

    const txData = verification.data

    if (txData.status !== 'successful') {
      await prisma.paymentEvent.create({
        data: {
          company_name: '',
          event_type: 'payment.verification_failed',
          tx_ref,
          transaction_id,
          amount: txData.amount,
          currency: txData.currency,
          status: txData.status || 'failed',
        },
      })
      return {
        success: false,
        error: 'Transaction was not successful.',
        code: 'TX_NOT_SUCCESSFUL',
      }
    }

    if (!txData.amount || !txData.currency) {
      return { success: false, error: 'Invalid transaction data.', code: 'TX_INVALID_DATA' }
    }

    const subscription = await prisma.subscription.findFirst({
      where: { flutterwave_tx_ref: tx_ref },
    })

    if (!subscription) {
      return { success: false, error: 'Subscription not found.', code: 'SUBSCRIPTION_NOT_FOUND' }
    }

    const durationDays = getPlanDurationDays(subscription.plan)
    const now = new Date()
    const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

    await prisma.subscription.update({
      where: { subscription_id: subscription.subscription_id },
      data: {
        status: 'Active',
        flutterwave_transaction_id: transaction_id,
        current_period_start: now,
        current_period_end: periodEnd,
      },
    })

    await prisma.paymentEvent.create({
      data: {
        company_name: subscription.company_name,
        event_type: 'payment.completed',
        tx_ref,
        transaction_id,
        amount: txData.amount,
        currency: txData.currency,
        status: 'successful',
        meta: { plan: subscription.plan, period_end: periodEnd.toISOString() },
      },
    })

    return {
      success: true,
      data: { company_name: subscription.company_name, status: 'Active' },
    }
  } catch (err) {
    console.error('[PaymentService] verify failed:', err instanceof Error ? err.message : err)
    return { success: false, error: 'Verification failed.', code: 'TX_VERIFY_FAILED' }
  }
}

export async function handleWebhookEvent(
  event: string,
  payload: {
    tx_ref?: string
    transaction_id?: string
    amount?: number
    currency?: string
    status?: string
    customer?: { email: string }
    meta?: Record<string, unknown>
  }
): Promise<void> {
  const companyName =
    (payload.meta?.company_name as string) || ''

  await prisma.paymentEvent.create({
    data: {
      company_name: companyName,
      event_type: event,
      tx_ref: payload.tx_ref,
      transaction_id: payload.transaction_id,
      amount: payload.amount,
      currency: payload.currency,
      status: payload.status || 'unknown',
      customer_email: payload.customer?.email,
      meta: { raw_event: `[Event type: ${event}]` },
    },
  })

  if (event === 'charge.completed' && payload.status === 'successful') {
    const subscription = payload.tx_ref
      ? await prisma.subscription.findFirst({
          where: { flutterwave_tx_ref: payload.tx_ref },
        })
      : null

    if (subscription) {
      const durationDays = getPlanDurationDays(subscription.plan)
      const now = new Date()
      const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

      await prisma.subscription.update({
        where: { subscription_id: subscription.subscription_id },
        data: {
          status: 'Active',
          flutterwave_transaction_id: payload.transaction_id,
          current_period_start: now,
          current_period_end: periodEnd,
        },
      })
    }
  }
}

export async function getSubscriptionStatus(
  company_name: string
): Promise<ServiceResult<{ status: string; plan: string; period_end?: string }>> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { company_name },
    })

    if (!subscription) {
      return { success: true, data: { status: 'none', plan: '' } }
    }

    const now = new Date()
    if (
      subscription.status === 'Active' &&
      subscription.current_period_end &&
      subscription.current_period_end < now
    ) {
      await prisma.subscription.update({
        where: { subscription_id: subscription.subscription_id },
        data: { status: 'PastDue' },
      })
      return {
        success: true,
        data: { status: 'PastDue', plan: subscription.plan, period_end: subscription.current_period_end.toISOString() },
      }
    }

    return {
      success: true,
      data: {
        status: subscription.status,
        plan: subscription.plan,
        period_end: subscription.current_period_end?.toISOString(),
      },
    }
  } catch (err) {
    console.error('[PaymentService] subscription status failed:', err instanceof Error ? err.message : err)
    return { success: false, error: 'Could not fetch subscription.', code: 'SUBSCRIPTION_FETCH_FAILED' }
  }
}

export async function listPaymentEvents(
  company_name: string,
  limit = 20
): Promise<ServiceResult<unknown[]>> {
  try {
    const events = await prisma.paymentEvent.findMany({
      where: { company_name },
      orderBy: { created_at: 'desc' },
      take: limit,
    })
    return { success: true, data: events }
  } catch {
    return { success: false, error: 'Could not fetch payment events.', code: 'EVENTS_FETCH_FAILED' }
  }
}
