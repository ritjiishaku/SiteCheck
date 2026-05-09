# SKILL: Flutterwave Payment Integration — SiteCheck

> Path: `.agents/skills/flutterwave-integration/SKILL.md`
> Built from the official Flutterwave v4 API documentation: https://developer.flutterwave.com/docs/getting-started
> Last read: April 2026
>
> Use this skill for every task involving payment initiation, verification,
> webhook handling, token management, or subscription billing in SiteCheck.
> SiteCheck uses Flutterwave exclusively. No other payment provider is permitted.

---

## 1. Overview

SiteCheck uses the **Flutterwave v4 API** to handle company subscription payments.

| Setting          | Value                                              |
| ---------------- | -------------------------------------------------- |
| API version      | v4 (not v3 — they are structurally different)      |
| Currency         | NGN (Nigerian Naira) only                          |
| Payment model    | Recurring SaaS subscription per company            |
| Auth method      | OAuth 2.0 — access token, expires every 10 min     |
| Webhook header   | `flw-signature`                            |
| Idempotency key  | `X-Idempotency-Key` — required on all POST calls   |

---

## 2. Environments

Flutterwave v4 has two environments. Never mix credentials between them.

| Environment | Base URL                                            | Purpose               |
| ----------- | --------------------------------------------------- | --------------------- |
| Sandbox     | `https://developersandbox-api.flutterwave.com`      | Development & testing |
| Production  | `https://f4bexperience.flutterwave.com`             | Live payments         |
| Auth URL    | `https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token` | Both environments |

### Environment Configuration

```typescript
// src/lib/flutterwave/config.ts

const isProd = process.env.NODE_ENV === 'production'

export const FLW_CONFIG = {
  baseUrl: isProd
    ? 'https://f4bexperience.flutterwave.com'
    : 'https://developersandbox-api.flutterwave.com',
  authUrl: 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token',
  clientId: isProd
    ? process.env.FLW_PROD_CLIENT_ID!
    : process.env.FLW_SANDBOX_CLIENT_ID!,
  clientSecret: isProd
    ? process.env.FLW_PROD_CLIENT_SECRET!
    : process.env.FLW_SANDBOX_CLIENT_SECRET!,
  secretHash: process.env.FLUTTERWAVE_WEBHOOK_HASH!,
} as const
```

> Sandbox test data is archived after 30 days and cannot be recovered.

---

## 3. Environment Variables

Add all of these to your `.env` file. Never hardcode any value.

```bash
# Flutterwave — Sandbox (development)
FLW_SANDBOX_CLIENT_ID=
FLW_SANDBOX_CLIENT_SECRET=

# Flutterwave — Production (live)
FLW_PROD_CLIENT_ID=
FLW_PROD_CLIENT_SECRET=

# Shared — set this in Flutterwave dashboard Settings > Webhooks
FLUTTERWAVE_WEBHOOK_HASH=
```

To retrieve credentials:
- **Sandbox**: Log in to `https://developersandbox.flutterwave.com` and copy from the main dashboard
- **Production**: Flutterwave dashboard → Settings → API Keys → Switch to v4 live API keys

---

## 4. Authentication — OAuth 2.0

Flutterwave v4 uses **OAuth 2.0 with client credentials grant**.
Access tokens expire every **10 minutes**. Refresh at least 1 minute before expiry.
Never use API keys directly — always exchange for a token first.

### Token Manager

```typescript
// src/lib/flutterwave/token-manager.ts

import { FLW_CONFIG } from './config'

interface TokenState {
  accessToken: string | null
  expiresAt: number  // Unix ms timestamp
}

class FlutterwaveTokenManager {
  private state: TokenState = { accessToken: null, expiresAt: 0 }

  /**
   * Returns a valid access token, refreshing automatically if needed.
   * Call this before every Flutterwave API request.
   */
  async getToken(): Promise<string> {
    const secondsLeft = (this.state.expiresAt - Date.now()) / 1000

    // Refresh if no token or less than 60 seconds remain
    if (!this.state.accessToken || secondsLeft < 60) {
      await this.refresh()
    }

    return this.state.accessToken!
  }

  private async refresh(): Promise<void> {
    const response = await fetch(FLW_CONFIG.authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: FLW_CONFIG.clientId,
        client_secret: FLW_CONFIG.clientSecret,
        grant_type: 'client_credentials',
      }),
    })

    if (!response.ok) {
      throw new Error(`[Flutterwave] Token refresh failed: ${response.status}`)
    }

    const data = await response.json()

    this.state = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
  }
}

// Singleton — one token manager per server process
export const flwTokenManager = new FlutterwaveTokenManager()
```

### Base API Request Wrapper

```typescript
// src/lib/flutterwave/client.ts

import { flwTokenManager } from './token-manager'
import { FLW_CONFIG } from './config'
import { randomUUID } from 'crypto'

export class FlutterwaveAPIError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'FlutterwaveAPIError'
  }
}

/**
 * Authenticated Flutterwave API request.
 * Automatically injects Bearer token, Content-Type, and X-Idempotency-Key on POST.
 * Never call Flutterwave API from the client side — server only.
 */
export async function flwRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const token = await flwTokenManager.getToken()

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // X-Idempotency-Key is required on all POST requests
  if (method === 'POST') {
    headers['X-Idempotency-Key'] = randomUUID()
  }

  const response = await fetch(`${FLW_CONFIG.baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    // Log internally — never expose raw Flutterwave errors to the client
    console.error('[Flutterwave API Error]', {
      status: response.status,
      code: data.error?.code,
      path,
    })
    throw new FlutterwaveAPIError(
      data.error?.message ?? 'Payment request failed.',
      data.error?.code
    )
  }

  return data as T
}
```

---

## 5. SiteCheck Payment Flow

```
1. Company Admin selects a subscription plan on the SiteCheck dashboard
      ↓
2. SiteCheck backend saves a Pending payment record to the database
      ↓
3. SiteCheck backend calls Flutterwave POST /payments to create a payment link
      ↓
4. Admin is redirected to Flutterwave hosted checkout (card / bank transfer / USSD)
      ↓
5. Admin completes payment on Flutterwave
      ↓
6. Flutterwave redirects to SiteCheck callback URL with transaction_id and tx_ref
      ↓
7. SiteCheck backend calls GET /charges/:transaction_id to verify — checks status,
   currency, amount, and tx_ref all match the stored pending payment
      ↓
8. Flutterwave also sends a webhook (charge.completed) as async confirmation
      ↓
9. On successful verification → activate company subscription in the database
```

**Critical**: Always verify via the API (step 7). Never activate based on a redirect alone.
The webhook (step 8) is an additional async confirmation — process it too, idempotently.

---

## 6. Initiating a Payment

```typescript
// src/services/payment.service.ts

import { flwRequest } from '@/lib/flutterwave/client'
import type { MedicProfile } from '@/types'
import { randomUUID } from 'crypto'

interface InitiatePaymentInput {
  company_name: string
  admin: MedicProfile
  plan: 'starter-monthly' | 'professional-monthly' | 'enterprise-annual'
  amount_ngn: number      // NGN integer — e.g. 15000 means ₦15,000
}

export async function initiateSubscriptionPayment(
  input: InitiatePaymentInput
): Promise<{ payment_link: string; tx_ref: string }> {
  // Generate a unique transaction reference
  const tx_ref = `sitecheck-${input.company_name}-${randomUUID()}`

  // Store the pending payment BEFORE calling Flutterwave
  // This is how you reconcile the webhook and callback later
  await db.payments.create({
    data: {
      tx_ref,
      company_name: input.company_name,
      amount_ngn: input.amount_ngn,
      plan: input.plan,
      status: 'Pending',
      initiated_by: input.admin.medic_id,
    },
  })

  const response = await flwRequest<{ data: { link: string } }>(
    'POST',
    '/payments',
    {
      tx_ref,
      amount: input.amount_ngn,
      currency: 'NGN',
      payment_options: 'card,banktransfer,ussd',
      redirect_url: `${process.env.APP_URL}/api/v1/payments/callback`,
      customer: {
        email: input.admin.email,
        phone_number: input.admin.phone_number,
        name: input.admin.full_name,
      },
      customizations: {
        title: 'SiteCheck',
        description: `${input.plan} subscription — ${input.company_name}`,
        logo: `${process.env.APP_URL}/logo.png`,
      },
      meta: {
        company_name: input.company_name,
        plan: input.plan,
        admin_id: input.admin.medic_id,
      },
    }
  )

  return { payment_link: response.data.link, tx_ref }
}
```

---

## 7. Payment Verification (Callback Route)

```typescript
// src/api/v1/payments/callback/route.ts

import { flwRequest } from '@/lib/flutterwave/client'
import { auditService } from '@/services/audit.service'

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const transaction_id = searchParams.get('transaction_id')
  const tx_ref = searchParams.get('tx_ref')
  const status = searchParams.get('status')

  if (status !== 'successful' || !transaction_id || !tx_ref) {
    return Response.redirect(`${process.env.APP_URL}/payment/failed`)
  }

  try {
    // Verify via API — never trust redirect params alone
    const response = await flwRequest<{
      data: {
        status: string
        currency: string
        amount: number
        tx_ref: string
        meta: { company_name: string; plan: string; admin_id: string }
      }
    }>('GET', `/charges/${transaction_id}`)

    const charge = response.data

    // All four must match — status, currency, amount, and tx_ref
    const pendingPayment = await db.payments.findUnique({ where: { tx_ref } })

    if (
      charge.status !== 'successful' ||
      charge.currency !== 'NGN' ||
      charge.tx_ref !== tx_ref ||
      !pendingPayment ||
      charge.amount !== pendingPayment.amount_ngn
    ) {
      await auditService.log({
        performed_by: 'system',
        action: 'Payment verification failed or amount mismatch',
        target_record_id: tx_ref,
        target_record_type: 'Payment',
      })
      return Response.redirect(`${process.env.APP_URL}/payment/failed`)
    }

    await activateCompanySubscription(charge.meta.company_name, charge.meta.plan)

    await auditService.log({
      performed_by: charge.meta.admin_id ?? 'system',
      action: 'Subscription payment verified and activated',
      target_record_id: tx_ref,
      target_record_type: 'Payment',
    })

    return Response.redirect(`${process.env.APP_URL}/payment/success`)

  } catch (err) {
    console.error('[Payment callback]', err instanceof Error ? err.message : err)
    return Response.redirect(`${process.env.APP_URL}/payment/failed`)
  }
}
```

---

## 8. Webhook Handler

### Setup on Flutterwave Dashboard
1. Log in → **Settings → Webhooks**
2. Enter your webhook URL: `https://yourdomain.com/api/v1/payments/webhook`
3. Set a **Secret Hash** → store as `FLUTTERWAVE_WEBHOOK_HASH` in your `.env`
4. Enable **webhook retries** (Flutterwave retries 3 times, 30-minute intervals)

### Signature Verification

The webhook header is **`flw-signature`**.
Flutterwave signs the raw body with `HMAC-SHA256` and encodes it as **base64**.

```typescript
// src/lib/flutterwave/webhook.ts

import crypto from 'crypto'

export function verifyFlutterwaveSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false

  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH
  if (!secretHash) throw new Error('FLUTTERWAVE_WEBHOOK_HASH is not set.')

  const expected = crypto
    .createHmac('sha256', secretHash)
    .update(rawBody)
    .digest('hex')

  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  )
}
```

### Webhook Route

```typescript
// src/api/v1/payments/webhook/route.ts

import { verifyFlutterwaveSignature } from '@/lib/flutterwave/webhook'
import { auditService } from '@/services/audit.service'

export async function POST(req: Request): Promise<Response> {
  // 1. Read raw body string — must be raw for HMAC to work
  const rawBody = await req.text()
  const signature = req.headers.get('flw-signature')

  // 2. Reject invalid signatures immediately
  if (!verifyFlutterwaveSignature(rawBody, signature)) {
    console.warn('[Webhook] Invalid signature — request rejected.')
    return new Response(JSON.stringify({ error: 'Invalid signature.' }), { status: 401 })
  }

  // 3. Return 200 immediately — Flutterwave times out after 60 seconds
  const response = new Response(JSON.stringify({ received: true }), { status: 200 })

  // 4. Process asynchronously
  ;(async () => {
    try {
      const payload = JSON.parse(rawBody) as FlutterwaveWebhookPayload

      // Idempotency — skip if this webhook ID was already processed
      const exists = await db.webhookEvents.findUnique({ where: { webhook_id: payload.id } })
      if (exists) return

      await db.webhookEvents.create({
        data: { webhook_id: payload.id, event_type: payload.type }
      })

      if (payload.type === 'charge.completed') {
        await handleChargeCompleted(payload)
      } else if (payload.type === 'charge.failed') {
        await handleChargeFailed(payload)
      }
    } catch (err) {
      // Log server-side only — never expose internals
      console.error('[Webhook] Processing error:', err instanceof Error ? err.message : err)
    }
  })()

  return response
}

async function handleChargeCompleted(payload: FlutterwaveWebhookPayload) {
  const { data } = payload
  if (data.status !== 'succeeded' || data.currency !== 'NGN') return

  await activateCompanySubscription(data.meta?.company_name!, data.meta?.plan!)

  await auditService.log({
    performed_by: data.meta?.admin_id ?? 'system',
    action: 'Subscription activated via webhook',
    target_record_id: data.reference,
    target_record_type: 'Payment',
  })
}

async function handleChargeFailed(payload: FlutterwaveWebhookPayload) {
  await auditService.log({
    performed_by: 'system',
    action: 'Payment failed — webhook received',
    target_record_id: payload.data.reference,
    target_record_type: 'Payment',
  })
}
```

---

## 9. Webhook Payload Types

```typescript
// src/lib/flutterwave/types.ts

export interface FlutterwaveWebhookPayload {
  id: string            // Webhook ID — e.g. "wbk_W5p6ktwU0jQ8RO4By860"
  type: 'charge.completed' | 'charge.failed' | string
  timestamp: number     // Unix milliseconds
  data: {
    id: string          // Charge ID — e.g. "chg_Hq4oBRTJ4r"
    status: 'succeeded' | 'failed' | 'pending'
    amount: number
    currency: string
    reference: string   // Your tx_ref
    customer: {
      id: string
      name: string | null
      email: string
      phone: string | null
    }
    payment_method: {
      type: 'card' | 'mobile_money' | 'bank_transfer' | 'ussd'
    }
    meta: {
      company_name?: string
      plan?: string
      admin_id?: string
    }
  }
}
```

---

## 10. Idempotency Rules

All `POST` requests to Flutterwave must include `X-Idempotency-Key`.
This is already handled automatically by `flwRequest()` in Section 4.

| Scenario                       | Action                                             |
| ------------------------------ | -------------------------------------------------- |
| Network error or 5xx response  | Retry with the **same** idempotency key            |
| 4xx error                      | Fix the error, generate a **new** key, then retry  |
| Duplicate request (same key)   | Flutterwave returns original response — safe       |
| Cache hit response             | Header `X-Idempotency-Cache-Hit: true` is returned |

Always use a **UUID** as the idempotency key — not a timestamp or sequential ID.

---

## 11. Error Codes Reference

| Code      | Type                       | Action for SiteCheck                              |
| --------- | -------------------------- | ------------------------------------------------- |
| `10400`   | `REQUEST_NOT_VALID`        | Fix request payload — check required fields       |
| `10401`   | `UNAUTHORIZATION`          | Token expired — `flwTokenManager` refreshes auto  |
| `10409`   | `RESOURCE_CONFLICT`        | Duplicate tx_ref — generate a new one             |
| `10500`   | `INTERNAL_SERVER_ERROR`    | Retry with exponential backoff                    |
| `1100409` | `CHARGE_ALREADY_EXISTS`    | tx_ref already used — generate a new one          |
| `1105500` | `CHARGE_FAILED`            | Upstream failure — retry with new idempotency key |
| `1107500` | `CHARGE_CREATION_FAILED`   | System error — retry after delay                  |
| `1140400` | `CHARGE_NOT_SUCCESSFUL`    | Bank declined — notify admin, do not retry        |
| `1141400` | `REDIRECT_URL_INVALID`     | Fix the APP_URL env variable format               |
| `1125400` | `CURRENCY_NOT_SUPPORTED`   | Ensure currency is set to NGN                     |

Never expose Flutterwave error codes or messages to end users.
Always show a plain-language message: *"Payment could not be processed. Please try again."*

---

## 12. SiteCheck Subscription Plans

```typescript
// src/lib/flutterwave/plans.ts

export const SITECHECK_PLANS = [
  {
    plan_id: 'starter-monthly',
    name: 'Starter',
    billing: 'Monthly',
    amount_ngn: 15000,      // ₦15,000/month
    max_medics: 3,
  },
  {
    plan_id: 'professional-monthly',
    name: 'Professional',
    billing: 'Monthly',
    amount_ngn: 35000,      // ₦35,000/month
    max_medics: 10,
  },
  {
    plan_id: 'enterprise-annual',
    name: 'Enterprise',
    billing: 'Annual',
    amount_ngn: 300000,     // ₦300,000/year
    max_medics: 999,
  },
] as const

export type PlanId = typeof SITECHECK_PLANS[number]['plan_id']
```

---

## 13. SiteCheck Payment API Route Index

| Method | SiteCheck Route                     | What it does                                       |
| ------ | ----------------------------------- | -------------------------------------------------- |
| POST   | `/api/v1/payments/initiate`         | Creates Flutterwave payment link, redirects admin  |
| GET    | `/api/v1/payments/callback`         | Verifies transaction via `GET /charges/:id`        |
| POST   | `/api/v1/payments/webhook`          | Receives and processes Flutterwave webhook events  |
| GET    | `/api/v1/payments/status/:tx_ref`   | Returns subscription status from local DB          |

---

## 14. Testing in Sandbox

Use sandbox credentials only in development. Never use live credentials outside production.

### Test Cards

| Card Number         | CVV | Expiry | PIN  | OTP   | Result             |
| ------------------- | --- | ------ | ---- | ----- | ------------------ |
| 5531 8866 5214 2950 | 564 | 09/32  | 3310 | 12345 | Successful         |
| 4187 4274 1556 4246 | 828 | 09/32  | 3310 | 12345 | Successful         |
| 5258 5859 2266 6510 | 883 | 09/32  | 3310 | 12345 | Insufficient funds |

### Webhook Testing
Use `https://webhook.site` to inspect payloads before wiring up a local server.

---

## 15. Absolute Rules — Never Violate

- Never call Flutterwave API from the browser or client — server-side only
- Never hardcode `client_id`, `client_secret`, or `FLUTTERWAVE_WEBHOOK_HASH` in code
- Never log raw webhook payloads — they may contain card or account data
- Never activate a subscription from a redirect callback alone — always verify via API
- Never use v3 API endpoints — SiteCheck uses v4 exclusively
- Never use any payment provider other than Flutterwave
- Always include `X-Idempotency-Key` on every POST request
- Always verify `flw-signature` before processing any webhook
- Always save a pending payment record to the database before calling Flutterwave
- Always respond `200` to webhooks immediately — process events asynchronously
- Always verify: status + currency + amount + tx_ref must all match before activating

---

## 16. Official References

| Resource        | URL                                                    |
| --------------- | ------------------------------------------------------ |
| Getting Started | https://developer.flutterwave.com/docs/getting-started |
| Authentication  | https://developer.flutterwave.com/docs/authentication  |
| Environments    | https://developer.flutterwave.com/docs/environments    |
| Webhooks        | https://developer.flutterwave.com/docs/webhooks        |
| Idempotency     | https://developer.flutterwave.com/docs/idempotency     |
| Error Codes     | https://developer.flutterwave.com/docs/common-errors   |
| Best Practices  | https://developer.flutterwave.com/docs/best-practices  |
| API Reference   | https://developer.flutterwave.com/reference            |

---

*skills/flutterwave-integration/SKILL.md — SiteCheck v1.0 — Built from Flutterwave v4 live API docs*
