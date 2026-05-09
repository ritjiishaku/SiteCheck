import { login } from '@/services/auth.service'
import { handleRouteError } from '@/lib/api/error-handler'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    const result = await login(email, password)
    const response = Response.json({ success: true, data: { token: result.token } })
    response.headers.set(
      'Set-Cookie',
      `refresh_token=${result.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
    )
    return response
  } catch (err) {
    if (err instanceof Error && err.message) {
      return Response.json({ success: false, error: err.message, code: 'LOGIN_ERROR' }, { status: 401 })
    }
    return handleRouteError(err)
  }
}
