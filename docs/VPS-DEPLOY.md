# Deploy Nimal Safari on a KVM VPS

Production should run on a **VPS with a persistent disk**, not Vercel. The app uses SQLite, local blog files, and image uploads — all stored under `DATA_PATH`.

**Hostinger + automatic deploys:** see **[HOSTINGER-CICD.md](./HOSTINGER-CICD.md)**.

## Requirements

- Ubuntu 22.04 / 24.04 (or similar Linux)
- **Node.js 22+** (`node -v`)
- Domain pointed to the VPS: `nimalsafari.com` → server public IP
- Ports: **80**, **443** open (SSH as you prefer)

## 1. Server setup

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx certbot python3-certbot-nginx

# Node 22 (NodeSource — adjust if you use nvm/fnm)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should be v22.x
```

## 2. Persistent data directory

```bash
sudo mkdir -p /var/lib/nimalsafari/data
sudo chown "$USER:$USER" /var/lib/nimalsafari/data
```

This folder holds:

- `app.db` — payments (SQLite)
- `blogs.json` — blog posts
- `uploads/` — admin-uploaded images (when `DATA_PATH` is set)

## 3. Deploy the application

```bash
cd /var/www
sudo mkdir -p nimalsafari && sudo chown "$USER:$USER" nimalsafari
git clone <your-repo-url> nimalsafari
cd nimalsafari

npm ci
cp env.production.example .env
nano .env   # fill in all CHANGE_ME values
npm run build
```

## 4. Environment file

Use the template in the repo root:

```bash
cp env.production.example .env
```

Required changes:

| Variable | What to set |
|----------|-------------|
| `PUBLIC_APP_URL` | `https://nimalsafari.com` |
| `DATA_PATH` / `DATABASE_PATH` | `/var/lib/nimalsafari/data` paths (see template) |
| `GOOGLE_*` / `AUTH_SECRET` / `ADMIN_ALLOWED_EMAILS` | Google OAuth admin login |
| `RESEND_*` / `EMAIL_FROM` | Transactional email |
| `ONEPAY_*` | Live merchant credentials |
| `ONEPAY_CALLBACK_TOKEN` | Same as in OnePay portal |

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## 5. Run with PM2 (keeps app running after logout)

```bash
sudo npm install -g pm2
cd /var/www/nimalsafari
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # follow the printed command
```

## 6. Nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/nimalsafari
```

Use the example in `deploy/nginx-nimalsafari.conf`, then:

```bash
sudo ln -s /etc/nginx/sites-available/nimalsafari /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d nimalsafari.com -d www.nimalsafari.com
```

## 7. OnePay checklist

1. **Callback URL:** `https://nimalsafari.com/api/payments/onepay/callback`
2. **Redirect URL:** uses `PUBLIC_APP_URL` (customer returns to `/pay/<token>/status`)
3. **IP whitelist:** VPS public IPv4 as `x.x.x.x/32` (not localhost)
4. **Live credentials** in `.env` with `APP_ENV=production`

## 8. Google OAuth checklist

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

- **Authorized JavaScript origins:** `https://nimalsafari.com`
- **Authorized redirect URIs:** `https://nimalsafari.com/api/auth/callback/google`

## 9. Resend email

- Verify domain `nimalsafari.com` in Resend
- Set `EMAIL_FROM` to an address on that domain (e.g. `bookings@nimalsafari.com`)

## 10. Updates (redeploy without losing data)

```bash
cd /var/www/nimalsafari
git pull
npm ci
npm run build
pm2 restart nimalsafari
```

Data in `/var/lib/nimalsafari/data` is **not** removed by redeploys.

## 11. Backups (recommended)

```bash
# Daily cron example — tarball the data directory
0 3 * * * tar -czf /backup/nimalsafari-$(date +\%Y\%m\%d).tar.gz /var/lib/nimalsafari/data
```

## Troubleshooting

| Issue | Check |
|-------|--------|
| Admin shows “temporary data” warning | You are still on Vercel, or `DATA_PATH` is not set |
| Payments 500 | `pm2 logs nimalsafari`, disk permissions on `DATA_PATH` |
| Google login fails | Redirect URI and `AUTH_SECRET` |
| Email not sent | Resend domain verification, webhook reached server |
| OnePay fails | IP whitelist, live creds, `PUBLIC_APP_URL` is HTTPS |

**Health check (logged in as admin):** `GET https://nimalsafari.com/api/admin/db-status`  
Expect `"driver": "payments:sqlite"` and `"ephemeral": false`.
