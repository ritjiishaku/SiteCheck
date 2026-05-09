# AGENTS.md — SiteCheck

> Read this file completely before generating, editing, or deleting any code.
> This is the single source of truth for every agent working on the SiteCheck codebase.

---

## 1. Project Identity

| Field            | Value                                          |
| ---------------- | ---------------------------------------------- |
| Product          | SiteCheck                                      |
| Type             | Digital clinical records platform (SaaS)       |
| Version          | 1.0                                            |
| Owner            | Ritji Ishaku                                   |
| Country          | Nigeria                                        |
| Compliance       | Nigeria Data Protection Act (NDPA) 2023        |
| Availability     | 24/7 — zero planned downtime                   |
| Payment Provider | Flutterwave (NGN-first, Nigerian market)        |
| Font             | Plus Jakarta Sans — all levels, no exceptions  |

---

## 2. What This Product Does

SiteCheck eliminates the **double-entry problem** for Nigerian site medics:

- Medics consult patients on paper → re-enter data into Excel → email reports to managers
- SiteCheck replaces all three steps with a single digital workflow
- One entry. Automatic reports. Live drug stock. Real-time manager dashboard.

The platform is **offline-first**, **NDPA-compliant**, and designed for **non-technical users**.

---

## 3. Agent Configuration (Antigravity-Specific)

### Preferred Model
- **Claude Opus 4.6** — use for all tasks involving schemas, security, compliance, payment logic, and RBAC
- **Gemini 3.1 Pro** — acceptable for boilerplate scaffolding and non-sensitive file generation
- **GPT-OSS** — do not use for any task touching patient data, auth, or Flutterwave logic

### Terminal Execution Policy
- Set to **Request Review** (Review-driven development)
- Never set to Always Proceed on this project
- Never run `chmod`, `sudo`, or permission-escalating commands without explicit developer approval

### JavaScript Execution Policy
- Set to **Request Review**
- Agent must not auto-execute JavaScript in the browser when testing auth flows, patient data, or payment workflows

### Agent Manager vs Editor

| Task                                          | Use              |
| --------------------------------------------- | ---------------- |
| Scaffold a new feature, schema, or model      | Agent Manager    |
| Edit a specific file or component             | Editor View      |
| Build Flutterwave payment integration         | Editor View      |
| Generate reports, exports, PDF logic          | Agent Manager    |
| Debug a specific function or error            | Editor View      |
| Set up offline sync logic                     | Agent Manager    |
| Any task touching authentication or RBAC      | Editor View      |
| Run and test app in browser                   | Agent Manager    |

### Workspace Setup
- Place this `AGENTS.md` at the project root
- Reference with `@AGENTS.md` at the start of every Agent Manager session
- Rule files live in `.agents/rules/`
- Skills live in `skills/`
- Workflows live in `workflows/`

---

## 4. Core Principles — Never Violate These

1. **Offline-first.** The app must work without internet. Save locally, sync silently when reconnected. Never assume network availability.
2. **No tech stack prescription.** The PRD defines behaviour and data models, not implementation. Do not lock in a framework without developer confirmation.
3. **NDPA compliance is non-negotiable.** All patient data encrypted at rest and in transit. No patient data in logs, cache, or unencrypted storage.
4. **No record deletion.** Patient records are archived only. All submitted data is immutable.
5. **Simple above everything.** Users are non-technical site medics. Minimum steps. Zero jargon in UI copy.
6. **No AI diagnostics in v1.** AI layer = descriptive analytics only. No clinical decision support.
7. **Sessions are protected.** Auto-lock at 10 minutes inactivity. All unsaved data auto-preserved on interruption.
8. **Flutterwave handles all payments.** No Paystack. No Stripe. No other payment provider.
9. **No pure white surfaces.** Use `#FAF8F4` (sand-50) as the default surface colour, not `#FFFFFF`.
10. **Plus Jakarta Sans only.** No other font at any level.

---

## 5. User Roles & RBAC

| Role        | Permissions                                                                           |
| ----------- | ------------------------------------------------------------------------------------- |
| Medic       | Create/view own patient records, dispense drugs, view own shift reports               |
| Manager     | View all medic records within company, generate/send reports, view drug inventory     |
| Admin       | Manage medic profiles, configure drug thresholds, manage company settings             |
| Super Admin | Full system access across all companies, manage admin accounts, view audit logs       |

**Access Rules:**
- A medic cannot view another medic's patient records
- A manager can only access records within their assigned company
- No user below Admin can access the Audit Log
- All role assignments require Admin or Super Admin approval
- Sessions auto-lock after 10 minutes of inactivity

---

## 6. Data Schemas (Canonical Reference)

### PatientRecord
```typescript
{
  patient_id         : string       // unique, auto-generated
  full_name          : string       // required
  staff_code         : string       // required
  serial_number      : string
  age                : number       // required
  gender             : 'Male' | 'Female' | 'Other'
  department         : string       // required
  company_name       : string       // required
  date_of_visit      : string       // DD/MM/YYYY
  time_of_visit      : string       // HH:MM WAT
  complaints         : string       // required
  vital_signs: {
    blood_pressure   : string       // e.g. 120/80 mmHg
    pulse_rate       : number       // bpm
    temperature      : number       // °C
    respiratory_rate : number       // breaths/min
    oxygen_saturation: number       // %
    weight           : number       // kg
    height           : number       // cm
    BMI              : number       // auto-calculated
  }
  diagnosis          : string       // required
  treatment          : string       // required
  drugs_dispensed    : DrugDispensed[]
  attending_medic_id : string       // FK → MedicProfile
  status             : 'Active' | 'Archived'
  created_at         : string       // ISO timestamp WAT
  updated_at         : string       // ISO timestamp WAT
}
```

### DrugDispensed
```typescript
{
  drug_id            : string       // FK → DrugInventory
  drug_name          : string
  quantity_dispensed : number       // required
  unit               : string       // tablets | vials | sachets
}
```

### MedicProfile
```typescript
{
  medic_id           : string       // unique, auto-generated
  full_name          : string       // required
  email              : string       // required, unique
  phone_number       : string       // 08XXXXXXXXX or +234XXXXXXXXXX
  role               : 'Medic' | 'Manager' | 'Admin' | 'SuperAdmin'
  company_name       : string       // required
  site_location      : string
  license_number     : string       // Nigerian Medical Council
  is_active          : boolean
  created_at         : string
  last_login         : string
}
```

### DrugInventory
```typescript
{
  drug_id            : string       // unique, auto-generated
  drug_name          : string       // required
  category           : string       // analgesic | antibiotic | antimalaria
  unit               : string       // tablets | vials | sachets
  quantity_in_stock  : number       // required
  low_stock_threshold: number       // required, default 10
  cost_per_unit      : number       // NGN
  expiry_date        : string       // DD/MM/YYYY
  supplier_name      : string
  last_restocked_at  : string
  updated_at         : string
}
```

### ConsultationLog
```typescript
{
  log_id             : string       // unique, auto-generated
  patient_id         : string       // FK → PatientRecord
  medic_id           : string       // FK → MedicProfile
  company_name       : string
  shift              : 'Morning' | 'Afternoon' | 'Night'
  date               : string       // DD/MM/YYYY
  total_drugs_used   : DrugDispensed[]
  notes              : string
  synced             : boolean      // offline sync flag
  created_at         : string
}
```

### Report
```typescript
{
  report_id          : string       // unique, auto-generated
  generated_by       : string       // FK → MedicProfile
  report_type        : 'Daily' | 'Weekly' | 'Monthly' | 'Custom'
  date_range: {
    from             : string       // DD/MM/YYYY
    to               : string       // DD/MM/YYYY
  }
  company_name       : string
  total_patients_seen: number
  total_drugs_used   : DrugDispensed[]
  medic_breakdown    : { medic_id: string; patients_seen: number }[]
  export_format      : 'PDF' | 'Excel'
  sent_via_email     : boolean
  recipient_email    : string
  status             : 'Pending' | 'Sent' | 'Failed'
  created_at         : string
}
```

### AuditLog
```typescript
{
  audit_id           : string       // unique, auto-generated
  performed_by       : string       // FK → MedicProfile
  action             : string       // e.g. "Created patient record"
  target_record_id   : string
  target_record_type : string       // PatientRecord | DrugInventory | ...
  timestamp          : string       // WAT
  ip_address         : string
  device_info        : string
}
```

---

## 7. Payment — Flutterwave

- All subscription payments are processed via **Flutterwave**
- Currency: **NGN (Nigerian Naira)**
- See `skills/flutterwave-integration/SKILL.md` for full integration guide
- Webhook handler reference: `skills/flutterwave-integration/resources/webhook-handler.ts`
- Never log raw Flutterwave payloads containing card or account data
- Always verify webhook signatures before processing any payment event
- Never use Paystack, Stripe, or any other payment provider

---

## 8. Version 1 Feature Checklist

### Must Build
- [ ] Patient record management (digital intake, all fields, BMI auto-calc)
- [ ] Medic profiles and multi-medic shift attribution
- [ ] Drug inventory with automatic deduction on record save
- [ ] Colour-coded stock alerts (Green / Amber / Red)
- [ ] Drug expiry date tracking
- [ ] One-click report generation (Daily / Weekly / Monthly / Custom)
- [ ] Report export — PDF and Excel
- [ ] Report email delivery with explicit confirmation step
- [ ] Role-based access control (Medic / Manager / Admin / Super Admin)
- [ ] Offline-first record creation with background sync
- [ ] Auto-preserve unsaved data on interruption or power failure
- [ ] Session auto-lock at 10 minutes
- [ ] Audit log for all data access and modification
- [ ] Manager dashboard with live patient and drug data
- [ ] Flutterwave subscription payment integration

### Do Not Build in v1
- [ ] AI insights / descriptive analytics
- [ ] Scheduled automated report delivery
- [ ] BMI trend tracking across visits
- [ ] Drug restock request and approval workflow
- [ ] Android mobile app

---

## 9. Localisation

| Setting        | Value                                    |
| -------------- | ---------------------------------------- |
| Language       | Nigerian English — plain, no jargon      |
| Timezone       | West Africa Time (WAT, UTC+1) — always   |
| Date format    | DD/MM/YYYY                               |
| Time format    | HH:MM (24-hour)                          |
| Currency       | Nigerian Naira (NGN / ₦)                 |
| Phone format   | 08XXXXXXXXX or +234XXXXXXXXXX            |
| Compliance     | Nigeria Data Protection Act (NDPA) 2023  |

---

## 10. Design Tokens (Quick Reference)

| Token          | Hex       | Role                            |
| -------------- | --------- | ------------------------------- |
| primary-500    | #1A9E78   | Primary buttons, key actions    |
| primary-900    | #074D3A   | Text on light backgrounds       |
| secondary-500  | #3D8C18   | Success states, confirmations   |
| tertiary-500   | #D48A00   | Warnings, low-stock, empty      |
| neutral-700    | #3A4A58   | Body text                       |
| neutral-900    | #1A2530   | Headings                        |
| sand-50        | #FAF8F4   | Card / form surfaces (not white)|
| error          | #E8392A   | Critical stock, blocked actions |

Full design system: `.agents/rules/design-system.md`

---

## 11. Reference Files

| File                                              | Purpose                              |
| ------------------------------------------------- | ------------------------------------ |
| `.agents/rules/architecture.md`                   | System architecture and folder rules |
| `.agents/rules/code-style.md`                     | Coding standards and conventions     |
| `.agents/rules/design-system.md`                  | Full design tokens, font, colours    |
| `.agents/rules/security.md`                       | Security rules and NDPA compliance   |
| `skills/flutterwave-integration/SKILL.md`         | Flutterwave payment integration      |
| `skills/component-builder/SKILL.md`               | How to build UI components           |
| `skills/api-route-scaffolder/SKILL.md`            | How to scaffold API routes           |
| `skills/db-migration-runner/SKILL.md`             | How to run database migrations       |
| `.agents/workflows/new-component.md`              | Workflow for adding a new component  |
| `.agents/workflows/new-api-route.md`              | Workflow for adding a new API route  |

---

## 12. Tech Stack

- Next.js (App Router) with React and TypeScript
- PostgreSQL for the database
- Prisma as the ORM
- Flutterwave for payments (not Paystack, regardless of what older documents say)
- Tailwind CSS for styling
- Server-side rendering for product pages so they load instantly and are shareable

---

## 13. Absolute Rules — Never Break These

- Do not implement AI diagnostic features in v1
- Do not soft-delete — archive status only, records are immutable
- Do not allow cross-company data access below Super Admin level
- Do not reference HIPAA — the law is NDPA 2023
- Do not expose raw error codes or stack traces to end users
- Do not use `#FFFFFF` as a surface colour — use `#FAF8F4`
- Do not use any font other than Plus Jakarta Sans
- Do not use Paystack, Stripe, or any payment provider other than Flutterwave
- Do not log or cache raw patient data in any unencrypted form
- Do not auto-execute terminal commands — always request review

---

*AGENTS.md — SiteCheck v1.0 — Confidential*
