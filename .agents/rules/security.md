# Security Rules — SiteCheck

> Rule file for Antigravity agents. Path: `.agents/rules/security.md`
> These rules are non-negotiable. Apply to every file, route, service, and component.

---

## 1. Compliance Framework

SiteCheck handles employee medical records. The applicable law is:

**Nigeria Data Protection Act (NDPA) 2023**

Do not reference HIPAA, GDPR, or any other framework as the primary standard.
NDPA is the law. All security decisions are grounded in NDPA obligations.

Key NDPA obligations for this product:
- Data minimisation — collect only what is necessary for the clinical purpose
- Purpose limitation — data collected for clinical records must not be used for other purposes
- Storage limitation — define and enforce data retention policies
- Integrity and confidentiality — protect data against unauthorised access and breach
- Accountability — maintain audit logs of all data access and modification
- Data subject rights — patients (employees) have the right to access their records

---

## 2. Authentication Rules

- Sessions expire after **10 minutes of inactivity** — hard requirement
- On session expiry, auto-lock the interface and require re-authentication
- All unsaved data must be preserved across session locks
- Use short-lived JWTs (10-minute expiry) or equivalent session tokens
- Refresh tokens must be stored in `httpOnly` cookies — never in `localStorage`
- Implement brute-force protection on login (rate limiting, lockout after 5 failed attempts)
- Passwords must be hashed with bcrypt (min 12 rounds) or equivalent
- Never store plaintext passwords or reversible password encodings

```typescript
// CORRECT — httpOnly cookie for refresh token
res.cookie('refresh_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
})

// WRONG — never store tokens in localStorage
localStorage.setItem('refresh_token', token)
```

---

## 3. Authorisation & RBAC

- Every API route must verify the user's role before executing
- Role checks happen at the **service layer** — never trust the client
- The RBAC matrix is:

| Role        | Scope                                              |
| ----------- | -------------------------------------------------- |
| Medic       | Own records only, within own company               |
| Manager     | All records within own company                     |
| Admin       | Company config, user management within own company |
| Super Admin | All companies, all data, audit logs                |

- Always enforce company scoping on every query
- A 403 response must never reveal why access was denied (no "you are not a Manager" messages)

```typescript
// Required on every protected route
async function requireRole(
  user: MedicProfile,
  allowedRoles: UserRole[]
): Promise<void> {
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError('Access denied.')  // Generic — no details
  }
}
```

---

## 4. Input Validation & Sanitisation

- Validate all inputs at the **API boundary** before they reach the service layer
- Never trust client-supplied data — validate types, lengths, and formats server-side
- Sanitise all user input before storing or displaying
- Validate Nigerian phone numbers: `/^(\+234|0)[789][01]\d{8}$/`
- Validate email format with a strict regex or validation library
- Validate date format: DD/MM/YYYY — reject anything else
- Maximum field lengths must be enforced:

| Field          | Max Length |
| -------------- | ---------- |
| full_name      | 100        |
| complaints     | 2000       |
| diagnosis      | 2000       |
| treatment      | 2000       |
| notes          | 2000       |
| drug_name      | 200        |
| department     | 100        |

---

## 5. Encryption

### At Rest
- All PII fields must be encrypted before storage:
  - `full_name`, `email`, `phone_number` (MedicProfile)
  - `full_name`, `complaints`, `diagnosis`, `treatment` (PatientRecord)
- Use AES-256-GCM or equivalent
- Encryption keys must be stored in environment variables — never in code or version control
- Key rotation must be planned for — use an envelope encryption pattern

### In Transit
- HTTPS only — reject HTTP connections at the infrastructure level
- TLS 1.2 minimum, TLS 1.3 preferred
- HSTS header required: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### Offline Storage
- Local patient records stored offline must be encrypted
- Use the Web Crypto API or equivalent for client-side encryption
- Encryption key derived from user's session — cleared on logout

---

## 6. API Security Headers

Every API response must include:

```typescript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}
```

---

## 7. Flutterwave Webhook Security

- Verify `flw-signature` header on every webhook request before processing
- Reject any webhook without a valid signature with `401`
- The webhook secret (`FLUTTERWAVE_WEBHOOK_HASH`) must be in environment variables
- Never log raw webhook payloads — they may contain card data
- Process webhooks idempotently — duplicate events must not double-charge or double-activate

```typescript
import crypto from 'crypto'

function verifyFlutterwaveWebhook(
  payload: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha256', process.env.FLUTTERWAVE_WEBHOOK_HASH!)
    .update(payload)
    .digest('hex')
  return hash === signature
}
```

---

## 8. Audit Logging

Every one of these actions must write an AuditLog entry:

| Action                        | Log fields required                        |
| ----------------------------- | ------------------------------------------ |
| User login                    | medic_id, timestamp, ip_address, device    |
| User logout                   | medic_id, timestamp                        |
| Session auto-lock             | medic_id, timestamp                        |
| Patient record created        | medic_id, patient_id, timestamp            |
| Patient record viewed         | medic_id, patient_id, timestamp            |
| Patient record archived       | medic_id, patient_id, timestamp            |
| Drug dispensed                | medic_id, drug_id, quantity, timestamp     |
| Drug inventory updated        | admin_id, drug_id, old_qty, new_qty        |
| Report generated              | medic_id, report_id, timestamp             |
| Report sent via email         | medic_id, report_id, recipient, timestamp  |
| Role assignment changed       | admin_id, target_medic_id, new_role        |
| Payment event received        | event_type, company_id, timestamp          |
| Failed login attempt          | email, ip_address, timestamp               |

- AuditLog is **append-only** — no updates or deletes
- No user below Admin can read AuditLog entries
- AuditLog entries must never be encrypted (they are the integrity record)

---

## 9. Sensitive Data Rules

- Never log patient PII — not in server logs, not in error tracking
- Never include patient data in error messages returned to clients
- Never cache raw patient records in browser storage without encryption
- Never send patient data in URL query parameters
- Never include patient data in email subjects — only in encrypted attachments
- Redact PII in any logging output:

```typescript
// CORRECT
logger.info('Patient record created', { patient_id: record.patient_id, medic_id: user.medic_id })

// WRONG
logger.info('Patient record created', { patient: record })  // contains PII
```

---

## 10. Dependency Security

- Run `npm audit` before every deployment
- No dependencies with known critical CVEs
- Pin dependency versions in `package.json` — no `^` or `~` on security-critical packages
- Review Flutterwave SDK updates before applying

---

## 11. Error Handling Security

- Generic error messages to clients — never expose internal details
- Log full errors server-side only
- Use consistent error shapes:

```typescript
// Client sees this — generic and safe
{ success: false, error: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" }

// Server logs this — full detail
logger.error('DB connection failed', { err, query, user_id })
```

---

## 12. Rate Limiting

| Endpoint                    | Limit             |
| --------------------------- | ----------------- |
| POST /api/v1/auth/login     | 5 requests / min  |
| POST /api/v1/payments/*     | 10 requests / min |
| POST /api/v1/patient-records| 60 requests / min |
| GET  /api/v1/reports/*      | 30 requests / min |
| All other endpoints         | 100 requests / min|

---

*security.md — SiteCheck v1.0*
