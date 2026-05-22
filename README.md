# Nimal Safari — Website

Official website for **Nimal Safari**, a wildlife safari agency based in Tissamaharama, Sri Lanka. The site covers safari packages across Yala, Udawalawa, Bundala and Lunugamwehera National Parks, includes a blog, and features an admin dashboard for blog and payment management.

**Live site:** [https://nimalsafari.com](https://nimalsafari.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | GSAP 3 + Framer Motion |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Payments | OnePay (Sri Lanka) |
| Analytics | Google Analytics 4 (`@next/third-parties`) |
| Icons | `lucide-react`, `react-icons` |

---

## Project Structure

```
app/
├── page.tsx                      # Home page
├── layout.tsx                    # Root layout (Nav, Footer, GA4)
├── sitemap.ts                    # Auto-generated sitemap
├── robots.ts                     # Crawl rules for Google
│
├── safaris/                      # Safari packages listing
├── parks/
│   ├── yala/                     # Yala National Park page
│   ├── udawalawa/                # Udawalawa National Park page
│   ├── bundala/                  # Bundala National Park page
│   └── lunugamwehera/            # Lunugamwehera National Park page
│
├── blog/                         # Public blog listing
├── aboutus/                      # About Us page
├── contact/                      # Contact page
│
├── admin/
│   ├── login/                    # Admin login page
│   └── dashboard/
│       ├── blogs/                # Blog CRUD (list / create / edit)
│       └── payments/             # OnePay payment link management
│
├── api/
│   ├── auth/                     # login, logout, check
│   ├── blogs/                    # blog REST endpoints
│   ├── payments/                 # OnePay link creation & callback
│   └── upload/                   # Image upload handler
│
└── Components/                   # Shared UI components

data/
└── app.db                        # SQLite database (auto-created on first run)

public/                           # Static assets (images, icons, OG images)
```

---

## Local Development Setup

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later (or pnpm / yarn)

### 1. Clone the repository

```bash
git clone <repository-url>
cd namalsafariweb
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables (one file)

Create **`.env.local`** in the project root — this is the **only** env file on your machine (gitignored). Do not commit it.

```env
APP_ENV=development
NEXT_PUBLIC_APP_ENV=development
PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=94767627295

GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
AUTH_SECRET=<openssl rand -base64 32>
ADMIN_ALLOWED_EMAILS=your@gmail.com

RESEND_API_KEY=re_...
EMAIL_FROM=Nimal Safari <bookings@nimalsafari.com>

ONEPAY_APP_ID=<sandbox-app-id>
ONEPAY_APP_TOKEN=<sandbox-app-token>
ONEPAY_HASH_SALT=<sandbox-hash-salt>
ONEPAY_ALLOW_HTTP_REDIRECT=1
```

| Variable | Required for |
|---|---|
| `APP_ENV` / `NEXT_PUBLIC_APP_ENV` | `development` on laptop; `qa` or `production` on servers |
| `PUBLIC_APP_URL` | Payment redirects and shared links |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp buttons (digits only, no `+`) |
| `GOOGLE_*` + `AUTH_SECRET` + `ADMIN_ALLOWED_EMAILS` | Admin login (Google OAuth) |
| `RESEND_*` | Payment/booking emails (optional in dev) |
| `ONEPAY_*` | Payments (sandbox creds in dev) |
| `DATABASE_PATH` | Optional locally (defaults to `./data/app.db`) |

**QA / production servers:** create a single **`.env`** file on the VPS (same variables, different values). Set `APP_ENV=qa` or `APP_ENV=production`. See [docs/PAYMENTS.md](docs/PAYMENTS.md) for OnePay and webhook details.

> **Note:** The `data/` folder and `app.db` SQLite database are created automatically on the first server start. You do not need to run any migrations manually.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack (hot reload) |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint across the project |

---

## Admin Panel

### Login URL

```
http://localhost:3000/admin/login        (development)
https://nimalsafari.com/admin/login      (production)
```

### Credentials

Admin access uses **Google sign-in**. In `.env.local`, set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, and add your Gmail to `ADMIN_ALLOWED_EMAILS` (comma-separated for multiple admins).

> Never commit `.env.local` or server `.env` to version control.

### Dashboard Features

After login you are redirected to `/admin/dashboard`. From there:

| Section | URL | What you can do |
|---|---|---|
| **Overview** | `/admin/dashboard` | See total blog count, quick-action links |
| **Blogs** | `/admin/dashboard/blogs` | View all published blog posts |
| **Create Blog** | `/admin/dashboard/blogs/create` | Write and publish a new blog post (with image upload) |
| **Edit Blog** | `/admin/dashboard/blogs/edit/[id]` | Edit or delete an existing post |
| **Payment Links** | `/admin/dashboard/payments` | List all OnePay payment links with status |
| **New Payment Link** | `/admin/dashboard/payments/create` | Generate a payment link for a customer booking |
| **Payment Detail** | `/admin/dashboard/payments/[id]` | View link details, copy URL, override status |

### Logging Out

Click the logout button in the admin sidebar, or navigate to `/api/auth/logout`.

---

## OnePay Payment Integration

Payments are processed via [OnePay Sri Lanka](https://onepay.lk). The flow is:

1. Admin creates a payment link from the dashboard → a unique shareable URL is generated.
2. Customer opens the link and pays via OnePay.
3. OnePay calls the webhook at `/api/payments/onepay/callback`.
4. Payment status is updated in the SQLite database (`PENDING` → `PAID` / `FAILED`).

### Webhook testing locally

OnePay cannot reach `http://localhost`. Use [ngrok](https://ngrok.com) for local end-to-end testing:

```bash
ngrok http 3000
```

Then update `PUBLIC_APP_URL` in `.env.local` to the ngrok HTTPS URL and configure the same URL as the webhook in the OnePay merchant portal.

---

## Production Deployment

### Vercel (marketing site only — not recommended for payments)

The app uses **SQLite** (`better-sqlite3`). Vercel’s serverless filesystem is **read-only** except `/tmp`, and `/tmp` is **not shared** across function instances — payment links can disappear or fail unpredictably.

**For admin payment links and OnePay**, deploy on your **VPS** with a persistent `DATABASE_PATH` (see below). If the site is on Vercel today, move the API + DB to the VPS or point `nimalsafari.com` at the VPS.

The app now writes payments (SQLite), blogs (`blogs.json`), and uploads to `/tmp/nimalsafari-data` on Vercel automatically so APIs do not 500. **Data is still not reliable** across instances — use a VPS for production.

Optional on Vercel (single folder for everything):

```env
DATA_PATH=/tmp/nimalsafari-data
```

On VPS (persistent):

```env
DATA_PATH=/var/lib/nimalsafari/data
DATABASE_PATH=/var/lib/nimalsafari/data/app.db
```

### Environment variables on the server

Create one **`.env`** file on the VPS (not in git). Use live credentials and `APP_ENV=production`. Rebuild after changing any `NEXT_PUBLIC_*` variable.

```env
APP_ENV=production
NEXT_PUBLIC_APP_ENV=production
PUBLIC_APP_URL=https://nimalsafari.com
NEXT_PUBLIC_WHATSAPP_NUMBER=94767627295

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_SECRET=...
ADMIN_ALLOWED_EMAILS=admin@gmail.com

RESEND_API_KEY=re_...
EMAIL_FROM=Nimal Safari <bookings@nimalsafari.com>

DATABASE_PATH=/var/lib/nimalsafari/data/app.db

ONEPAY_APP_ID=<live-app-id>
ONEPAY_APP_TOKEN=<live-app-token>
ONEPAY_HASH_SALT=<live-hash-salt>
# Do not set ONEPAY_ALLOW_HTTP_REDIRECT in production
```

### Build & start

```bash
npm run build
npm run start
```

> The SQLite database file is stored at `./data/app.db` by default. Make sure this path is on a persistent volume (not ephemeral storage) when deploying to containerised environments like Docker or Railway.

---

## SEO

The following SEO features are implemented:

- **Per-page metadata** — unique title, description and keywords on every route
- **`metadataBase`** — ensures correct canonical and OG image URLs
- **Canonical URLs** — `alternates.canonical` set on all public pages
- **Open Graph & Twitter Cards** — full OG images and card metadata on every page
- **JSON-LD Structured Data** — `LocalBusiness`, `TouristTrip` (per park), `FAQPage` (home)
- **Dynamic sitemap** — auto-served at `/sitemap.xml`
- **robots.txt** — auto-served at `/robots.txt`, blocks `/admin/` and `/api/`
- **Google Analytics 4** — Measurement ID `G-VLXEQQL4J7`

### OG images

Place `1200 × 630 px` images in `/public/` with these exact filenames for social sharing previews:

| File | Used on |
|---|---|
| `og-home.jpg` | Home page |
| `og-safaris.jpg` | Safaris listing |
| `og-yala.jpg` | Yala park page |
| `og-udawalawa.jpg` | Udawalawa park page |
| `og-bundala.jpg` | Bundala park page |
| `og-lunugamwehera.jpg` | Lunugamwehera park page |
| `og-about.jpg` | About Us page |
| `og-blog.jpg` | Blog listing |
| `og-contact.jpg` | Contact page |

---

## Public Routes

| Route | Description |
|---|---|
| `/` | Home — hero, popular safaris, gallery, FAQ |
| `/safaris` | All safari packages |
| `/parks/yala` | Yala National Park |
| `/parks/udawalawa` | Udawalawa National Park |
| `/parks/bundala` | Bundala National Park |
| `/parks/lunugamwehera` | Lunugamwehera National Park |
| `/blog` | Blog listing |
| `/aboutus` | About Nimal Safari |
| `/contact` | Contact details and map |
| `/terms-and-conditions` | Terms & Conditions |
| `/privacy-policy` | Privacy Policy |
| `/refund-policy` | Refund Policy |
| `/sitemap.xml` | Auto-generated XML sitemap |
| `/robots.txt` | Crawler rules |

---

## Contact

- **Email:** nimalsafariyala@gmail.com
- **Phone / WhatsApp:** +94 76 762 7295
- **Location:** Tissamaharama, Southern Province, Sri Lanka
- **TripAdvisor:** [Nimal Safari on TripAdvisor](https://www.tripadvisor.com/Attraction_Review-g1102395-d5512904-Reviews-Nimal_Safari-Tissamaharama_Southern_Province.html)
