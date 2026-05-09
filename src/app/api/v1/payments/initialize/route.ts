import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { initiateSubscriptionPayment } from '@/services/payment.service'
import { InitiatePaymentSchema } from '@/lib/validation/payment'
import { log } from '@/services/audit.service'

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Admin', 'SuperAdmin'])

    const body = await req.json()
    const parsed = InitiatePaymentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' },
        { status: 422 }
      )
    }

    const result = await initiateSubscriptionPayment({
      company_name: user.company_name,
      admin_id: user.medic_id,
      email: parsed.data.email,
      plan: parsed.data.plan,
      amount_ngn: parsed.data.amount_ngn,
    })

    if (result.success) {
      await log({
        performed_by: user.medic_id,
        action: 'Initiated subscription payment',
        target_record_type: 'Subscription',
        ip_address: req.headers.get('x-forwarded-for') || undefined,
      })
    }

    return Response.json(result, { status: result.success ? 200 : 422 })
  } catch (err) {
    return handleRouteError(err)
  }
}
