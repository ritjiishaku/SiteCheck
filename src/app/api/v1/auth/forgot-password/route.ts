import { generateResetToken } from '@/services/auth.service'
import { handleRouteError } from '@/lib/api/error-handler'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    const resetToken = await generateResetToken(email)

    if (resetToken) {
      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
      console.log('[PasswordReset] Link:', resetUrl)
    }

    return Response.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
