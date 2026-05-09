# Architecture Rules — SiteCheck

> Rule file for Antigravity agents. Path: `.agents/rules/architecture.md`
> Read before generating any folder structure, module, or system-level code.

---

## 1. Architectural Philosophy

SiteCheck is an **offline-first, NDPA-compliant, multi-tenant SaaS** platform.

Every architectural decision must satisfy these three constraints in order:
1. **Does it work offline?** If no, redesign.
2. **Is it NDPA-compliant?** If no, reject.
3. **Is it simple enough for a non-technical site medic?** If no, simplify.

---

## 2. System Layers

```
┌─────────────────────────────────────────────┐
│                  CLIENT LAYER                │
│  Web App (Desktop/Laptop primary)            │
│  Service Worker — offline queue              │
│  Local storage — encrypted patient data      │
└────────────────────┬────────────────────────┘
                     │ HTTPS only
┌────────────────────▼────────────────────────┐
│                   API LAYER                  │
│  REST or GraphQL (developer decision)        │
│  Auth middleware — RBAC enforcement          │
│  Rate limiting — per company, per role       │
│  Audit log writer — every mutation logged    │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│               SERVICE LAYER                  │
│  PatientService     ReportService            │
│  DrugService        NotificationService      │
│  AuthService        AuditService             │
│  PaymentService (Flutterwave)                │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│               DATA LAYER                     │
│  Primary DB — relational (developer choice)  │
│  Encryption at rest — all PII fields         │
│  Offline queue — synced on reconnect         │
│  Audit log store — append-only               │
└─────────────────────────────────────────────┘
```

---

## 3. Multi-Tenancy Model

- Each **company** is an isolated tenant
- All queries must be scoped by `company_name` or `company_id`
- No query should ever return data across companies without Super Admin role
- Tenant isolation must be enforced at the **service layer**, not just the UI

```typescript
// CORRECT — always scope by company
const records = await db.patientRecords.findMany({
  where: { company_name: currentUser.company_name }
})

// WRONG — never query without company scope
const records = await db.patientRecords.findMany()
```

---

## 4. Offline-First Architecture

### Principle
The app must be fully functional with zero internet connectivity.

### Implementation Pattern
```
User action
  → Write to local encrypted store (immediate)
  → Add to sync queue
  → On reconnect: flush queue to server
  → Server responds → update local store
  → Show sync confirmation banner
```

### Rules
- Every mutation must write locally first before attempting a server sync
- The sync queue must survive app restarts, browser closes, and power failures
- Sync conflicts are resolved server-wins for data integrity
- Show `"You are offline. Records saved locally."` banner on connection loss
- Show `"Records synced successfully."` banner on reconnect
- Never block a medic from saving a patient record due to connectivity

---

## 5. Folder Structure

```
/
├── AGENTS.md                          # Root agent context
├── .agents/
│   └── rules/
│       ├── architecture.md            # This file
│       ├── code-style.md
│       ├── design-system.md
│       └── security.md
├── .agents/
│   ├── rules/                        # Agent rule files
│   ├── skills/
│   │   ├── flutterwave-integration/
│   │   │   ├── SKILL.md
│   │   │   └── resources/
│   │   │       └── webhook-handler.ts
│   │   ├── component-builder/
│   │   │   └── SKILL.md
│   │   ├── api-route-scaffolder/
│   │   │   └── SKILL.md
│   │   └── db-migration-runner/
│   │       └── SKILL.md
│   └── workflows/
│       ├── new-component.md
│       └── new-api-route.md
├── src/
│   ├── app/                           # Pages / routes
│   ├── components/
│   │   ├── ui/                        # Primitive components
│   │   ├── forms/                     # Form components
│   │   ├── tables/                    # Data table components
│   │   ├── charts/                    # Analytics chart components
│   │   └── layouts/                   # Layout wrappers
│   ├── services/
│   │   ├── patient.service.ts
│   │   ├── drug.service.ts
│   │   ├── report.service.ts
│   │   ├── auth.service.ts
│   │   ├── audit.service.ts
│   │   ├── notification.service.ts
│   │   └── payment.service.ts
│   ├── api/
│   │   ├── patients/
│   │   ├── drugs/
│   │   ├── reports/
│   │   ├── auth/
│   │   └── payments/
│   ├── db/
│   │   ├── schema/                    # DB schema definitions
│   │   └── migrations/                # Migration files
│   ├── lib/
│   │   ├── offline/                   # Offline queue and sync logic
│   │   ├── encryption/                # Encryption utilities
│   │   ├── flutterwave/               # Payment SDK wrapper
│   │   └── rbac/                      # Role-based access helpers
│   ├── hooks/                         # Shared logic hooks
│   ├── stores/                        # Client-side state stores
│   └── types/                         # TypeScript type definitions
├── public/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 6. API Design Rules

- All API routes are prefixed with `/api/v1/`
- All responses follow this envelope:
```typescript
// Success
{ success: true, data: T, message?: string }

// Error
{ success: false, error: string, code: string }
```
- Never return raw database errors to the client
- All timestamps in API responses are ISO 8601 in WAT (UTC+1)
- All currency values in API responses are in **NGN integers** (kobo not used)
- Authentication header: `Authorization: Bearer <token>`
- Every mutating route must emit an AuditLog entry

---

## 7. Service Layer Rules

- Each domain has exactly one service file
- Services are the only layer that talks to the database
- Services enforce RBAC — never trust the API layer to enforce access
- Services must not call other services directly (no circular deps)
- Services must emit audit events for every create, update, or archive action

---

## 8. Payment Architecture (Flutterwave)

```
Client initiates subscription
  → PaymentService creates Flutterwave payment link
  → Redirect client to Flutterwave checkout
  → Flutterwave processes payment
  → Flutterwave sends webhook to /api/v1/payments/webhook
  → Verify webhook signature
  → Update company subscription status
  → Send confirmation notification to Admin
```

- The webhook endpoint must verify `flw-signature` on every request
- Payment state is stored in the database, never in client state
- Failed payments must be logged to AuditLog
- See `skills/flutterwave-integration/SKILL.md` for full implementation

---

## 9. Encryption Requirements

- All PII fields (full_name, email, phone_number, diagnosis, treatment, complaints) must be encrypted at rest
- Encryption key management is the developer's responsibility — do not hardcode keys
- Use environment variables for all secrets
- Never log decrypted PII

---

## 10. Environment Variables Pattern

```bash
# Database
DATABASE_URL=

# Auth
JWT_SECRET=
JWT_EXPIRY=10m
SESSION_LOCK_TIMEOUT=600000   # 10 minutes in ms

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_WEBHOOK_HASH=

# Email
EMAIL_SERVICE_API_KEY=
EMAIL_FROM=noreply@sitecheck.ng

# Encryption
ENCRYPTION_KEY=
ENCRYPTION_IV=

# App
APP_ENV=development
APP_URL=
TIMEZONE=Africa/Lagos
```

---

*architecture.md — SiteCheck v1.0*
