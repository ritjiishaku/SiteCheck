# SKILL: API Route Scaffolder

> Path: `.agents/skills/api-route-scaffolder/SKILL.md`
> Use this skill whenever you are creating a new API route for SiteCheck.
> Read fully before generating any route file.

---

## Overview

All SiteCheck API routes follow a consistent, secure structure:
- Prefixed with `/api/v1/`
- TypeScript only
- Authentication and RBAC enforced on every protected route
- AuditLog written on every mutation
- Consistent response envelope
- No raw errors exposed to clients
- Company-scoped queries always

---

## Route Checklist

Before generating any route, confirm:

- [ ] Is the route prefixed with `/api/v1/`?
- [ ] Does it call `requireAuth()` before any logic?
- [ ] Does it call `requireRole()` for protected operations?
- [ ] Does it write to AuditLog on mutations?
- [ ] Does it use the standard response envelope?
- [ ] Are errors caught and sanitised before returning?
- [ ] Are all queries scoped by `company_name`?
- [ ] Are timestamps in ISO 8601 WAT (UTC+1)?

---

## 1. Standard Response Envelope

All routes return this shape — no exceptions:

```typescript
// Success
{
  success: true,
  data: T,
  message?: string
}

// Error
{
  success: false,
  error: string,       // Plain English — safe for client
  code: string         // Uppercase snake — for logging, never shown to user
}
```

---

## 2. Auth & RBAC Guards

```typescript
// src/lib/rbac/guards.ts

import type { MedicProfile } from '@/types'

type UserRole = 'Medic' | 'Manager' | 'Admin' | 'SuperAdmin'

export async function requireAuth(req: Request): Promise<MedicProfile> {
  // TODO: Implement JWT verification and return the current user
  // Throw UnauthorizedError if token is missing or invalid
  throw new Error('requireAuth not yet implemented')
}

export async function requireRole(
  user: MedicProfile,
  allowedRoles: UserRole[]
): Promise<void> {
  if (!allowedRoles.includes(user.role as UserRole)) {
    // Generic message — never reveal the reason
    throw new ForbiddenError('Access denied.')
  }
}

export function requireCompanyScope(
  user: MedicProfile,
  targetCompany: string
): void {
  if (user.role === 'SuperAdmin') return   // Super Admin sees all
  if (user.company_name !== targetCompany) {
    throw new ForbiddenError('Access denied.')
  }
}
```

---

## 3. GET Route Template

```typescript
// src/api/v1/[resource]/route.ts

import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { patientService } from '@/services/patient.service'

/**
 * GET /api/v1/patient-records
 * Returns all patient records for the current user's company.
 * Medics see only their own records. Managers see all within company.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    // 1. Authenticate
    const user = await requireAuth(req)

    // 2. Authorise
    await requireRole(user, ['Medic', 'Manager', 'Admin', 'SuperAdmin'])

    // 3. Parse query params
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') ?? '1')
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100)

    // 4. Execute — always company-scoped
    const result = await patientService.listRecords({
      company_name: user.company_name,
      medic_id: user.role === 'Medic' ? user.medic_id : undefined,  // Medic sees own only
      page,
      limit,
    })

    // 5. Return success envelope
    return Response.json({ success: true, data: result })

  } catch (err) {
    return handleRouteError(err)
  }
}
```

---

## 4. POST Route Template

```typescript
// src/api/v1/patient-records/route.ts

import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { patientService } from '@/services/patient.service'
import { auditService } from '@/services/audit.service'
import { validatePatientInput } from '@/lib/validation/patient'

/**
 * POST /api/v1/patient-records
 * Creates a new patient record.
 * Accessible by: Medic, Admin
 */
export async function POST(req: Request): Promise<Response> {
  try {
    // 1. Authenticate
    const user = await requireAuth(req)

    // 2. Authorise
    await requireRole(user, ['Medic', 'Admin'])

    // 3. Parse and validate body
    const body = await req.json()
    const validated = validatePatientInput(body)  // Throws ValidationError if invalid

    // 4. Inject server-side fields — never trust the client for these
    const input = {
      ...validated,
      attending_medic_id: user.medic_id,
      company_name: user.company_name,
      created_at: new Date().toISOString(),
      status: 'Active' as const,
    }

    // 5. Execute
    const record = await patientService.create(input)

    // 6. Audit log — required on every mutation
    await auditService.log({
      performed_by: user.medic_id,
      action: 'Created patient record',
      target_record_id: record.patient_id,
      target_record_type: 'PatientRecord',
    })

    // 7. Return success
    return Response.json(
      { success: true, data: record, message: 'Patient record saved.' },
      { status: 201 }
    )

  } catch (err) {
    return handleRouteError(err)
  }
}
```

---

## 5. PATCH Route Template (Archive — no DELETE)

```typescript
/**
 * PATCH /api/v1/patient-records/:id/archive
 * Archives a patient record. Records are never deleted.
 * Accessible by: Admin, SuperAdmin
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Admin', 'SuperAdmin'])

    const record = await patientService.getById(params.id)

    if (!record) {
      return Response.json(
        { success: false, error: 'Record not found.', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Enforce company scope
    requireCompanyScope(user, record.company_name)

    await patientService.archive(params.id)

    await auditService.log({
      performed_by: user.medic_id,
      action: 'Archived patient record',
      target_record_id: params.id,
      target_record_type: 'PatientRecord',
    })

    return Response.json({ success: true, data: null, message: 'Record archived.' })

  } catch (err) {
    return handleRouteError(err)
  }
}
```

---

## 6. Error Handler

```typescript
// src/lib/api/error-handler.ts

class UnauthorizedError extends Error { statusCode = 401 }
class ForbiddenError extends Error { statusCode = 403 }
class NotFoundError extends Error { statusCode = 404 }
class ValidationError extends Error { statusCode = 422 }

export function handleRouteError(err: unknown): Response {
  // 1. Zod Validation Errors
  if (err instanceof z.ZodError) {
    return Response.json(
      { success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' },
      { status: 422 }
    )
  }

  // 2. Known, safe errors
  if (err instanceof UnauthorizedError) {
    return Response.json(
      { success: false, error: 'You must be logged in.', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }
  if (err instanceof ForbiddenError) {
    return Response.json(
      { success: false, error: 'Access denied.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }
  if (err instanceof ValidationError) {
    return Response.json(
      { success: false, error: err.message, code: 'VALIDATION_ERROR' },
      { status: 422 }
    )
  }

  // Unknown error — log server-side, generic message to client
  console.error('[API Error]', err)
  return Response.json(
    { success: false, error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}
```

---

## 7. Route Index

| Method | Path                                          | Role Access                      |
| ------ | --------------------------------------------- | -------------------------------- |
| GET    | /api/v1/patient-records                       | Medic (own), Manager, Admin      |
| POST   | /api/v1/patient-records                       | Medic, Admin                     |
| GET    | /api/v1/patient-records/:id                   | Medic (own), Manager, Admin      |
| PATCH  | /api/v1/patient-records/:id/archive           | Admin, SuperAdmin                |
| GET    | /api/v1/drugs                                 | Medic, Manager, Admin            |
| POST   | /api/v1/drugs                                 | Admin                            |
| PATCH  | /api/v1/drugs/:id                             | Admin                            |
| GET    | /api/v1/reports                               | Manager, Admin                   |
| POST   | /api/v1/reports/generate                      | Manager, Admin                   |
| POST   | /api/v1/reports/:id/send                      | Manager, Admin                   |
| GET    | /api/v1/medics                                | Admin, SuperAdmin                |
| POST   | /api/v1/medics                                | Admin, SuperAdmin                |
| PATCH  | /api/v1/medics/:id                            | Admin, SuperAdmin                |
| POST   | /api/v1/auth/login                            | Public                           |
| POST   | /api/v1/auth/logout                           | Authenticated                    |
| POST   | /api/v1/payments/initiate                     | Admin                            |
| GET    | /api/v1/payments/callback                     | Public (Flutterwave redirect)    |
| POST   | /api/v1/payments/webhook                      | Public (Flutterwave — verified)  |
| GET    | /api/v1/audit-logs                            | Admin, SuperAdmin                |

---

---

## 8. Input Validation (Zod)

Always validate clinical data lengths to prevent DB overflows and meet NDPA requirements.

```typescript
// src/lib/validation/patient.ts
import { z } from 'zod'

export const PatientInputSchema = z.object({
  full_name: z.string().min(2).max(100),
  staff_code: z.string().min(1),
  age: z.number().int().min(0).max(120),
  gender: z.enum(['Male', 'Female', 'Other']),
  department: z.string().max(100),
  complaints: z.string().max(2000),      // Strict limit from security.md
  diagnosis: z.string().max(2000),
  treatment: z.string().max(2000),
})
```

---

## 9. Rate Limiting

Apply rate limits based on the `security.md` matrix:

- **Login**: 5 req/min
- **Payment**: 10 req/min
- **Patient Records**: 60 req/min
- **Reports**: 30 req/min

Ensure the company ID or IP address is used as the rate-limit key.

---

*skills/api-route-scaffolder/SKILL.md — SiteCheck v1.0*
