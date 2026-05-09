import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { generate, listByCompany } from '@/services/report.service'
import { log } from '@/services/audit.service'

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Manager', 'Admin', 'SuperAdmin'])
    const result = await listByCompany(user.company_name)
    return Response.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Manager', 'Admin'])
    const body = await req.json()

    const result = await generate({
      generated_by: user.medic_id,
      company_name: user.company_name,
      report_type: body.report_type,
      date_from: new Date(body.date_from),
      date_to: new Date(body.date_to),
      export_format: body.export_format || 'PDF',
      recipient_email: body.recipient_email,
    })

    if (!result.success) {
      return Response.json(result, { status: 422 })
    }

    await log({
      performed_by: user.medic_id,
      action: `Generated ${body.export_format} report`,
      target_record_id: result.data.report_id,
      target_record_type: 'Report',
    })

    return new Response(new Uint8Array(result.data.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.data.contentType,
        'Content-Disposition': `attachment; filename="${result.data.filename}"`,
        'X-Report-Id': result.data.report_id,
        'X-Report-Emailed': String(result.data.emailed),
      },
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
