# Code Style — SiteCheck

> Rule file for Antigravity agents. Path: `.agents/rules/code-style.md`
> Apply these standards to every file generated or edited in this project.

---

## 1. Language & Typing

- **TypeScript only** — no plain JavaScript files in `src/`
- Strict mode enabled — `"strict": true` in `tsconfig.json`
- No `any` types — use `unknown` and narrow, or define a proper type
- All function parameters and return types must be explicitly typed
- Use `interface` for object shapes that describe data models
- Use `type` for unions, intersections, and utility types

```typescript
// CORRECT
interface PatientRecord {
  patient_id: string
  full_name: string
  age: number
  status: 'Active' | 'Archived'
}

// WRONG — no implicit any, no missing return types
function getPatient(id) {
  return db.find(id)
}

// CORRECT
async function getPatient(id: string): Promise<PatientRecord | null> {
  return db.patientRecords.findUnique({ where: { patient_id: id } })
}
```

---

## 2. Naming Conventions

| Thing                  | Convention          | Example                          |
| ---------------------- | ------------------- | -------------------------------- |
| Files (components)     | PascalCase          | `PatientForm.tsx`                |
| Files (utils/services) | kebab-case          | `patient.service.ts`             |
| Files (hooks)          | camelCase           | `usePatientRecord.ts`            |
| Variables              | camelCase           | `patientRecord`                  |
| Constants              | SCREAMING_SNAKE     | `LOW_STOCK_THRESHOLD`            |
| Types / Interfaces     | PascalCase          | `MedicProfile`, `DrugInventory`  |
| Enums                  | PascalCase values   | `UserRole.Medic`                 |
| API routes             | kebab-case          | `/api/v1/patient-records`        |
| DB table names         | snake_case plural   | `patient_records`, `medic_profiles` |
| DB column names        | snake_case          | `attending_medic_id`             |
| Environment variables  | SCREAMING_SNAKE     | `FLUTTERWAVE_SECRET_KEY`         |

---

## 3. File & Component Structure

Every component file follows this order:

```typescript
// 1. Imports — external first, internal second
import { useState } from 'react'
import { MedicProfile } from '@/types'

// 2. Types / interfaces local to this file
interface Props {
  medic: MedicProfile
  onSave: (data: MedicProfile) => void
}

// 3. Constants
const DEFAULT_SHIFT = 'Morning'

// 4. Component
export function MedicCard({ medic, onSave }: Props) {
  // 4a. Hooks
  const [isEditing, setIsEditing] = useState(false)

  // 4b. Derived values
  const isActive = medic.is_active

  // 4c. Handlers
  function handleSave() {
    onSave(medic)
    setIsEditing(false)
  }

  // 4d. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

---

## 4. Error Handling

- Never expose raw errors, stack traces, or database messages to the UI
- All service functions must use try/catch and return a typed result
- Use a consistent result pattern:

```typescript
type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }

// Example
async function createPatientRecord(
  input: CreatePatientInput
): Promise<ServiceResult<PatientRecord>> {
  try {
    const record = await db.patientRecords.create({ data: input })
    return { success: true, data: record }
  } catch (err) {
    await auditService.logError(err)
    return { success: false, error: 'Could not save patient record.', code: 'PATIENT_CREATE_FAILED' }
  }
}
```

- User-facing error messages must be in **plain Nigerian workplace English**
- Never show error codes to end users

---

## 5. Async / Await

- Always use `async/await` — no `.then()` chains
- Always `await` promises — no floating promises
- Always handle errors with try/catch at the service layer

```typescript
// CORRECT
async function dispenseDrug(drugId: string, quantity: number) {
  try {
    await drugService.deductStock(drugId, quantity)
  } catch {
    // handle
  }
}

// WRONG
function dispenseDrug(drugId: string, quantity: number) {
  drugService.deductStock(drugId, quantity) // floating promise
}
```

---

## 6. Comments

- Write comments that explain **why**, not **what**
- Use JSDoc for all exported functions and types

```typescript
/**
 * Deducts the dispensed quantity from live drug stock.
 * Triggers a low-stock alert if quantity_in_stock falls below threshold.
 * Called automatically when a PatientRecord is saved.
 */
async function deductDrugStock(drugId: string, quantity: number): Promise<void>
```

- Inline comments only for non-obvious logic
- No commented-out code committed to the repo

---

## 7. Imports

- Use absolute imports via `@/` alias, not relative `../../`
- Group imports: external libraries → internal modules → types

```typescript
// CORRECT
import { useEffect } from 'react'
import { drugService } from '@/services/drug.service'
import type { DrugInventory } from '@/types'

// WRONG
import { drugService } from '../../../services/drug.service'
```

---

## 8. Environment Variables

- Never hardcode secrets, API keys, or environment-specific values
- Always access via `process.env.VARIABLE_NAME`
- Validate required env vars at app startup — fail loudly if missing
- See `.env.example` for all required variables

---

## 9. Date & Time

- All timestamps stored and transmitted in **ISO 8601 format**
- All timestamps displayed to users in **WAT (UTC+1)**
- All dates displayed in **DD/MM/YYYY** format
- All times displayed in **HH:MM (24-hour)** format
- Use a timezone-aware date library — never `new Date()` without timezone context
- Timezone constant: `Africa/Lagos`

```typescript
// CORRECT
import { formatInTimeZone } from 'date-fns-tz'
const display = formatInTimeZone(new Date(), 'Africa/Lagos', 'dd/MM/yyyy HH:mm')

// WRONG
const display = new Date().toLocaleString()
```

---

## 10. Currency

- All monetary values stored as **integers in NGN** (no kobo, no decimals)
- Display with `₦` prefix and comma-separated thousands
- Never use floating point for money

```typescript
// CORRECT — store as integer NGN
cost_per_unit: 500   // ₦500

// Display
function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}
```

---

## 11. RBAC in Code

- Every API route handler must call the RBAC guard before any logic
- Every service method that reads sensitive data must accept and validate a `currentUser` parameter

```typescript
// Every route
export async function GET(req: Request) {
  const user = await requireAuth(req)
  await requireRole(user, ['Manager', 'Admin', 'SuperAdmin'])
  // ... proceed
}
```

---

## 12. Testing Expectations

- Unit tests for every service function
- Integration tests for every API route
- Test files co-located: `patient.service.test.ts` next to `patient.service.ts`
- Test naming: `describe('PatientService') > it('should archive record, not delete it')`
- Never test implementation details — test behaviour

---

*code-style.md — SiteCheck v1.0*
