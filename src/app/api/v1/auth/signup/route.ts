import { signup } from '@/services/auth.service'
import { handleRouteError } from '@/lib/api/error-handler'

export async function POST(req: Request) {
  try {
    const { full_name, email, phone_number, company_name, password } = await req.json()
    const result = await signup({ full_name, email, phone_number, company_name, role: 'Medic', password })
    const response = Response.json({ success: true, data: { token: result.token } }, { status: 201 })
    response.headers.set(
      'Set-Cookie',
      `refresh_token=${result.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
    )
    return response
  } catch (err) {
    if (err instanceof Error && err.message) {
      return Response.json({ success: false, error: err.message, code: 'SIGNUP_ERROR' }, { status: 422 })
    }
    return handleRouteError(err)
  }
}
