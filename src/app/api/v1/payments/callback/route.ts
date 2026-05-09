import { verifyAndActivateSubscription } from '@/services/payment.service'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tx_ref = searchParams.get('tx_ref')
    const transaction_id = searchParams.get('transaction_id')
    const status = searchParams.get('status')

    const appUrl = process.env.APP_URL || 'http://localhost:3000'

    if (status === 'cancelled' || !tx_ref || !transaction_id) {
      return Response.redirect(`${appUrl}/dashboard/admin?payment=cancelled`, 302)
    }

    const result = await verifyAndActivateSubscription(tx_ref, transaction_id)

    if (result.success) {
      return Response.redirect(`${appUrl}/dashboard/admin?payment=success`, 302)
    }

    return Response.redirect(`${appUrl}/dashboard/admin?payment=failed`, 302)
  } catch {
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    return Response.redirect(`${appUrl}/dashboard/admin?payment=error`, 302)
  }
}
