import { resetPassword } from '@/services/auth.service'
import { handleRouteError } from '@/lib/api/error-handler'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) {
      return Response.json({ success: false, error: 'Token and password are required.' }, { status: 422 })
    }
    if (password.length < 8) {
      return Response.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 422 })
    }
    await resetPassword(token, password)
    return Response.json({ success: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
