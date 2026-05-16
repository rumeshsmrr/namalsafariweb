# Payment Links (OnePay)

Admins generate secure, single-use payment links for customer bookings.
Customers open the link, review the summary, and pay via OnePay's hosted
checkout. Status is confirmed via a server-to-server webhook.

## Architecture

```
Admin ──► /admin/dashboard/payments/create  (form)
           └── POST /api/payments           (creates DB row, returns token)
           └── share link manually (WhatsApp/email)

Customer ──► /pay/<token>                   (summary + Pay Now)
              └── POST /api/payments/<token>/initiate
                    └── server calls OnePay checkout API
                    └── returns redirect_url
              └── customer redirected to OnePay
              └── after paying, OnePay redirects to /pay/<token>/status

OnePay (server-to-server) ──► POST /api/payments/onepay/callback
    verified signature → atomic DB update → payment_requests.status = PAID|FAILED
```

## Data

SQLite database at `DATABASE_PATH` (default `./data/app.db`). Two tables:

- `payment_requests` — one row per link (customer info, amount, status, expiry).
- `payments` — one row per gateway transaction; unique on `transaction_id`
  so webhook retries are idempotent.

Amounts are stored in **minor units** (cents) to avoid float drift.

## Environment

Three deployment stages are supported. The OnePay endpoint is auto-selected
from `APP_ENV`, so you never have to change `ONEPAY_API_URL` by hand.

| `APP_ENV`     | OnePay endpoint (auto) | Typical use |
|---------------|------------------------|-------------|
| `development` | sandbox                | `npm run dev` on your laptop |
| `qa`          | sandbox                | Staging server — real users testing, no real money |
| `production`  | **live**               | Real payments |

A missing/unknown `APP_ENV` defaults to `development` → sandbox. That way a
misconfigured server can never accidentally charge real cards.

### Env file layout (one file per machine)

| Machine | File | `APP_ENV` |
|---------|------|-----------|
| Your laptop (`npm run dev`) | `.env.local` | `development` |
| QA / staging VPS | `.env` | `qa` |
| Production VPS | `.env` | `production` |

All env files are gitignored. Variable list and placeholders are in the root **README.md** → *Environment variables*.

### Required variables

| Var | Purpose |
|---|---|
| `APP_ENV` | `development` / `qa` / `production` — picks OnePay endpoint |
| `NEXT_PUBLIC_APP_ENV` | Same value, exposed to the browser for the sandbox badge |
| `PUBLIC_APP_URL` | Absolute URL used in shared links + OnePay redirect URL |
| `ONEPAY_APP_ID` | From OnePay merchant portal |
| `ONEPAY_APP_TOKEN` | From OnePay merchant portal (sent as `Authorization` header) |
| `ONEPAY_HASH_SALT` | From OnePay merchant portal, used for SHA256 signature |
| `DATABASE_PATH` | Persistent DB location on the VPS |
| `ONEPAY_API_URL` | *(optional)* override; default is `https://api.onepay.lk/v3/checkout/link/`. OnePay’s docs mention `api-sandbox.onepay.lk`, but that hostname does not resolve in DNS — use **sandbox credentials** from the portal with the production API host. |

### Visual sanity-check

Whenever `NEXT_PUBLIC_APP_ENV` is not `production`, the admin sidebar shows a
yellow/orange "DEVELOPMENT · SANDBOX" or "QA · SANDBOX" badge. No badge =
production = real money.

## Security model

- The customer never sends the amount — it is read from the DB by token.
- Public endpoints expose **only** the sanitized fields the customer needs.
- Webhook signatures are verified using `timingSafeEqual`.
- Transaction IDs are unique so repeated webhooks are no-ops.
- Token is 24 random bytes (base64url) — unguessable.
- Links expire after `expiresInHours` (default 72h); expired links cannot
  initiate payment.

## VPS deployment notes

1. Install native-build tools (one time):
   ```bash
   sudo apt install -y build-essential python3
   npm ci
   npm run build
   ```
2. Put the DB outside the repo:
   ```bash
   sudo mkdir -p /var/lib/nimalsafari/data
   sudo chown $USER:$USER /var/lib/nimalsafari/data
   echo 'DATABASE_PATH=/var/lib/nimalsafari/data/app.db' >> .env
   ```
3. Run a single Node instance under systemd or PM2 (SQLite is single-writer).
4. Put Nginx/Caddy in front for HTTPS.
5. Whitelist the webhook URL in the OnePay merchant portal:
   `https://nimalsafari.com/api/payments/onepay/callback`
6. Daily backup cron:
   ```bash
   0 3 * * * sqlite3 /var/lib/nimalsafari/data/app.db ".backup '/backups/app-$(date +\%F).db'"
   ```
   Then rsync `/backups/` offsite.

## Confirming OnePay fields for your account

OnePay sometimes ships merchant-specific variations of:

- The **signature field order** (see `signCheckoutRequest` in `lib/onepay.ts`).
- The **success status code** (see `mapOnePayStatus`).
- The **webhook payload field names**.

If sandbox testing returns a hash-mismatch error, adjust those three spots
(they are all isolated in `lib/onepay.ts`).

## Local development

```bash
# Create .env.local in the project root (see README.md for all variables)
npm run dev
```

The SQLite file is created automatically at `./data/app.db`.
Without valid OnePay env vars, creating a link still works, but clicking
Pay Now will return a 502. That's expected.

## Going to production — change checklist

1. On the VPS: create `.env` with production values (see README.md).
2. Confirm `APP_ENV=production` at the top of `.env`.
3. Confirm OnePay credentials are the **live** ones, not sandbox.
4. `npm ci && npm run build && npm start` (or PM2/systemd).
5. Open the admin dashboard — the yellow "SANDBOX" badge should be **gone**.
   If it's still there, `NEXT_PUBLIC_APP_ENV` is wrong and you rebuilt
   before fixing it (remember: `NEXT_PUBLIC_*` vars are baked in at build
   time, so a rebuild is required after changing them).
6. Create a small test link (e.g. LKR 100) and verify end-to-end with a
   real card before sharing the service with customers.
