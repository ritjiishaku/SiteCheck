# SiteCheck Implementation Plan

SiteCheck is an offline-first, NDPA-compliant, multi-tenant SaaS platform built to eliminate double-entry for Nigerian site medics. It replaces paper records and manual Excel reports with a digital workflow that tracks patient consultations, manages drug stock, and generates automated reports.

This plan details the technical roadmap for building Version 1.0 using Next.js (App Router), React, TypeScript, PostgreSQL (via Prisma), and Tailwind CSS, following the specific architectural, security, and design rules documented in the project's `.agents` rulesets.

## User Review Required

> [!IMPORTANT]  
> Please review this plan, particularly the Offline-First Sync Architecture and Database schema approaches. Once approved, I will begin execution step-by-step.

## Open Questions

> [!WARNING]  
> 1. Do you have a preferred relational database provider (e.g., Supabase, Neon, AWS RDS) for the PostgreSQL database?
> 2. What email provider should we use for report delivery (e.g., SendGrid, Resend)?
> 3. Should we initialize the project in the current directory (`./`) using `create-next-app` now?

## Proposed Changes

---

### Project Setup & Infrastructure

We will bootstrap the Next.js application and set up the foundational architecture according to `.agents/rules/architecture.md`.

#### [NEW] Next.js Initialization
- Initialize Next.js App Router project with TypeScript and Tailwind CSS.
- Configure `tsconfig.json` with strict mode.
- Set up environment variables (`.env.example`) for DB, Auth, Flutterwave, Email, and Encryption (see `architecture.md §10`).

#### [NEW] Tailwind CSS & Design System
- Configure `tailwind.config.ts` mapping all design tokens (primary, secondary, tertiary, neutral, sand, error palettes; type scale; spacing; border radius; shadows) as custom Tailwind extensions — never use raw hex in components.
- Set `#FAF8F4` (`sand-50`) as the default surface color and `#F4F6F8` (`neutral-50`) as the page background.
- Never use `#FFFFFF` as a default surface (elevated overlays are the only exception).

#### [NEW] Folder Structure
- Create `src/components/{ui,forms,tables,charts,layouts}/`, `src/services/`, `src/api/`, `src/lib/{offline,encryption,flutterwave,rbac}/`, `src/hooks/`, `src/stores/`, `src/types/`, `prisma/`, `public/`, `tests/{unit,integration,e2e}/` matching the required architecture.

---

### Database & ORM (Prisma)

We will use Prisma to manage the PostgreSQL database, ensuring all tables follow snake_case plural naming and use correct types.

#### [NEW] `prisma/schema.prisma`
- Define all models: `MedicProfile`, `PatientRecord`, `DrugInventory`, `ConsultationLog`, `Report`, `AuditLog`, `SyncQueue`.
- **MedicProfile** includes `email_hash` (SHA-256 of lowercase+trimmed email) for unique lookups without decrypting PII.
- **PatientRecord** includes `DrugDispensed` as a JSON array (`drug_id`, `drug_name`, `quantity_dispensed`, `unit`).
- **ConsultationLog** tracks per-shift drug usage with FK to both PatientRecord and MedicProfile.
- **SyncQueue** table for server-side offline sync reconciliation with retry/expiry logic.
- All timestamps stored as `DateTime` (timestamptz in PostgreSQL) — displayed in WAT at the application layer.
- All monetary values stored as **integers in NGN** (no decimals, no floats — e.g. 500 = ₦500).
- All PII columns marked with `// PII — encrypted` comments; encryption handled at service layer, not DB.
- Ensure all models enforce company tenancy (`company_name`).
- Set up Foreign Key constraints with `onDelete: Restrict` (never cascade delete patient records).
- Enforce `REVOKE UPDATE, DELETE ON audit_logs FROM app_user` for append-only integrity.

#### [NEW] `prisma/seed.ts`
- Idempotent seed script that creates the initial SuperAdmin (`admin@sitecheck.ng`).
- Configure `"prisma": { "seed": "ts-node prisma/seed.ts" }` in `package.json`.

---

### Security, Encryption & RBAC

We will implement the security constraints outlined in `.agents/rules/security.md`.

#### [NEW] `src/lib/encryption.ts`
- Implement AES-256-GCM functions to encrypt/decrypt PII fields (`full_name`, `email`, `phone_number`, `complaints`, `diagnosis`, `treatment`, `recipient_email`) at rest.
- Use Web Crypto API for client-side offline encryption; derive key from user session, clear on logout.

#### [NEW] `src/lib/rbac.ts`
- Implement middleware/guards for Medic, Manager, Admin, and Super Admin roles.
- Every service method that reads sensitive data must accept and validate a `currentUser` parameter.
- Company scope enforced at the service layer — never trust the client.

#### [NEW] `src/services/auth.service.ts`
- Implement login with brute-force protection (5 failed attempts lockout), bcrypt (min 12 rounds), JWT generation (10 min expiry), and httpOnly cookies for refresh tokens.
- Implement session auto-lock mechanics — on 10 min inactivity, lock the interface and require re-auth; preserve all unsaved data across lock.

#### [NEW] `src/services/audit.service.ts`
- Create the append-only AuditLog service to track every mutation and access (login, create, view, archive, dispense, report generation, payment events).
- No user below Admin can read audit logs.

---

### Offline-First Architecture

Crucial for the Nigerian site environment, allowing uninterrupted usage without internet.

#### [NEW] `public/sw.js` & `src/lib/offline/syncManager.ts`
- Register a Service Worker to cache the application shell (Next.js App Router pages and static assets).
- Implement IndexedDB for local storage of **encrypted** patient data and drug operations.
- Create a Sync Queue that intercepts mutations when offline, stores them locally (encrypted), and flushes to the server on reconnect (resolving with server-wins).
- Sync queue must survive app restarts, browser closes, and power failures.
- Show `"You are offline. Records saved locally."` banner on connection loss (info style, fixed top).
- Show `"Records synced successfully."` banner on reconnect (success style, auto-dismiss after 4 seconds).
- Never block a medic from saving a patient record due to connectivity.

#### [NEW] Draft Auto-Preserve
- All form components auto-save draft to `localStorage` on every change using `draft_{formId}` keys.
- On successful submission, clear the draft.
- On interruption (browser close, power failure), draft is restored on next load.

---

### Domain Services & APIs

All services will strictly handle RBAC, encryption, audit logging, and offline synchronization, while keeping the API layer lightweight.

#### [NEW] `src/services/patient.service.ts` & `src/api/patients/route.ts`
- Handle patient record creation and retrieval. Auto-calculate BMI from weight and height.
- Drugs_dispensed deduction automatically triggers inventory stock update.
- Audit log entry on every create, view, and archive.

#### [NEW] `src/services/drug.service.ts` & `src/api/drugs/route.ts`
- Deduct stock upon dispensing, trigger colour-coded stock alerts (green / amber / red).
- Track drug expiry dates — flag expired stock.
- Only Admin can add or update drugs.

#### [NEW] `src/services/report.service.ts` & `src/api/reports/route.ts`
- Compile shift/date-range data and export to PDF/Excel or dispatch via Email.
- Include medic breakdown per report.
- Reports are generated by Manager or Admin only.

#### [NEW] `src/services/payment.service.ts` & `src/api/payments/webhook/route.ts`
- Integrate Flutterwave SDK for subscription payments and verify `flw-signature` webhook header.
- Save pending payment record to DB before calling Flutterwave; verify status + currency + amount + tx_ref before activating.
- Never log raw webhook payloads (may contain card data).

---

### User Interface & Components

We will build out the frontend ensuring simplicity and using only plain Nigerian workplace English.

#### [NEW] Design System Foundation
- Configure `tailwind.config.ts` with all custom colours, typography scale (`display-lg` through `micro`), spacing scale, border radii, and shadows from `design-system.md`.
- Required field indicator: amber dot (`•`) in `text-tertiary-500` — not a red asterisk.
- Error messages in plain English — never show error codes.
- Minimum touch target: 44px height for all interactive elements.
- Focus visible rings on all interactive elements: `focus-visible:ring-2 focus-visible:ring-primary-500`.

#### [NEW] Shared UI Components (`src/components/ui/`)
- Buttons (primary, secondary, danger, ghost), Form Inputs, Alerts/Banners (offline, sync, success, error), Tables (with alternating rows), Cards, StockBadge (adequate/low/critical colour mapping), OfflineBanner, and Spinner.

#### [NEW] App Pages (`src/app/`)
- `(auth)/login/page.tsx`: Authentication screen with rate limiting.
- `(dashboard)/medic/page.tsx`: Medic dashboard (New Patient, Shift Log, own records list).
- `(dashboard)/manager/page.tsx`: Manager dashboard (Reports generation, Drug Inventory with stock alerts, all company records).
- `(dashboard)/admin/page.tsx`: Admin dashboard (Medic profiles management, drug inventory CRUD, company settings).
- `(dashboard)/super-admin/page.tsx`: Super Admin dashboard (cross-company view, audit log, admin account management).
- `(dashboard)/patient-intake/page.tsx`: Offline-capable patient intake form with draft auto-preserve.
- `(dashboard)/drugs/page.tsx`: Drug inventory list with colour-coded stock badges and expiry flags.
- `(dashboard)/reports/page.tsx`: One-click report generation (Daily/Weekly/Monthly/Custom) with PDF/Excel export and email delivery with confirmation step.

---

## V1 Scope Boundaries

### What We Are Building
- Patient record management (digital intake, BMI auto-calc, all fields)
- Medic profiles and multi-medic shift attribution
- Drug inventory with automatic deduction and colour-coded stock alerts
- Drug expiry date tracking
- One-click report generation (Daily / Weekly / Monthly / Custom) with PDF/Excel export
- Report email delivery with explicit confirmation step
- Role-based access control (Medic / Manager / Admin / Super Admin)
- Offline-first record creation with background sync
- Auto-preserve unsaved data on interruption or power failure
- Session auto-lock at 10 minutes
- Audit log for all data access and modification
- Manager dashboard with live patient and drug data
- Flutterwave subscription payment integration

### What We Are NOT Building (v1 Exclusions)
- AI insights / descriptive analytics
- Scheduled automated report delivery
- BMI trend tracking across visits
- Drug restock request and approval workflow
- Android mobile app

---

## Verification Plan

### Automated Tests
- Unit tests for all Service functions (especially offline sync conflict resolution, RBAC enforcement, and encryption).
- Integration tests for API routes.
- Format and lint checks to enforce TypeScript strictness and code style rules.
- Co-locate test files: `patient.service.test.ts` next to `patient.service.ts`.

### Manual Verification
- **Offline Flow**: Disconnect network, create patient records, dispense drugs, reconnect network, and verify background sync logic and banners ("Records synced successfully." auto-dismiss).
- **Draft Recovery**: Close browser mid-form, reopen, verify unsaved data is restored from localStorage draft.
- **Security Check**: Wait 10 minutes to verify auto-session lock. Inspect local storage to ensure no plaintext PII or auth tokens exist.
- **Payment Verification**: Trigger test Flutterwave webhook with `flw-signature` and ensure subscription state updates properly.
- **Drug Stock**: Dispense drugs and verify automatic deduction and colour change (adequate → low → critical).
- **Audit Trail**: Verify every mutation creates an AuditLog entry and that Medics cannot read audit logs.

---

*implementation_plan.md — SiteCheck v1.0*
