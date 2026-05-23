# Hostinger KVM VPS + CI/CD (Nimal Safari)

Guide for running **nimalsafariweb** on a Hostinger **KVM VPS** that already hosts other apps, with **automatic deploys** on `git push` (same pattern as many multi-project VPS setups).

## Architecture (one server, many projects)

```text
Internet → Nginx (443) → each domain → localhost:PORT
                              ├── other-project-a → :3000
                              ├── other-project-b → :3001
                              └── nimalsafari.com → :3010  (this app)
```

- **Code:** `/var/www/nimalsafari` (git clone)
- **Data (never deleted on deploy):** `/var/lib/nimalsafari/data`
- **Secrets:** `.env` on the server only (not in git, not overwritten by CI/CD)
- **Process manager:** PM2 app name `nimalsafari`
- **CI/CD:** GitHub Actions → SSH → `deploy/deploy.sh`

---

## Part A — One-time server setup (Hostinger VPS)

### 1. SSH into the VPS

Use the SSH user/host from Hostinger hPanel (often `root` or a sudo user).

### 2. Node.js 22 (if not already installed)

```bash
node -v   # need v22+
```

If missing:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Persistent data directory

```bash
sudo mkdir -p /var/lib/nimalsafari/data
sudo chown "$USER:$USER" /var/lib/nimalsafari/data
```

### 4. Clone the repo

Pick a path that matches your other projects (example):

```bash
sudo mkdir -p /var/www
sudo chown "$USER:$USER" /var/www
cd /var/www
git clone https://github.com/YOUR_ORG/namalsafariweb.git nimalsafari
cd nimalsafari
```

### 5. Create `.env` (once)

```bash
cp env.production.example .env
nano .env
```

Set at minimum:

- `PUBLIC_APP_URL=https://nimalsafari.com`
- `DATA_PATH` / `DATABASE_PATH`
- Google, Resend, OnePay, `AUTH_SECRET` (generate with `openssl rand -base64 32`)

Add a **dedicated port** if `3000` is already used:

```env
PORT=3010
```

### 6. First deploy (manual)

```bash
chmod +x deploy/deploy.sh
npm ci
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # run the command it prints
```

### 7. Nginx site (new file, do not break other sites)

```bash
sudo cp deploy/nginx-nimalsafari.conf /etc/nginx/sites-available/nimalsafari
```

Edit the file:

- `server_name` → your domain
- `proxy_pass` → `http://127.0.0.1:3010` (same as `PORT` in `.env`)

```bash
sudo ln -s /etc/nginx/sites-available/nimalsafari /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d nimalsafari.com -d www.nimalsafari.com
```

### 8. DNS (Hostinger or Porkbun)

Point `nimalsafari.com` **A record** → VPS public IP.

### 9. OnePay + Google

- OnePay callback: `https://nimalsafari.com/api/payments/onepay/callback`
- OnePay IP whitelist: VPS public IP `/32`
- Google redirect: `https://nimalsafari.com/api/auth/callback/google`

---

## Part B — CI/CD with GitHub Actions

This repo includes `.github/workflows/deploy-production.yml`.

### Flow

```text
git push main → GitHub Actions → SSH to VPS → deploy/deploy.sh
                                              → git pull
                                              → npm ci && npm run build
                                              → pm2 restart nimalsafari
```

`.env` on the server is **never** touched by the workflow.

### 1. Deploy key for GitHub (on VPS)

So the server can `git pull` without a password:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/nimalsafari_deploy -N ""
cat ~/.ssh/nimalsafari_deploy.pub
```

Add the public key in GitHub → repo → **Settings → Deploy keys** (read-only is enough).

On the VPS:

```bash
cd /var/www/nimalsafari
git remote -v
# ensure origin uses SSH, e.g. git@github.com:ORG/namalsafariweb.git
```

Or use HTTPS + a machine user token — match whatever your **other projects** use.

### 2. SSH key for GitHub Actions → VPS

On your **PC** (or use an existing deploy key pair from another project):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/gh_actions_nimalsafari -N ""
```

- **Private key** → GitHub repo secret `SSH_PRIVATE_KEY` (full PEM, including `BEGIN`/`END` lines)
- **Public key** → VPS `~/.ssh/authorized_keys` for the deploy user

Test:

```bash
ssh -i ~/.ssh/gh_actions_nimalsafari USER@YOUR_VPS_IP "echo ok"
```

### 3. GitHub repository secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Example | Required |
|--------|---------|----------|
| `SSH_HOST` | `123.45.67.89` or VPS hostname | Yes |
| `SSH_USER` | `root` or `deploy` | Yes |
| `SSH_PRIVATE_KEY` | contents of private key file | Yes |
| `DEPLOY_PATH` | `/var/www/nimalsafari` | Yes |
| `SSH_PORT` | `22` | No |
| `PM2_NAME` | `nimalsafari` | No |
| `DEPLOY_BRANCH` | `main` | No |

### 4. Trigger deploy

```bash
git push origin main
```

Or: GitHub → **Actions** → **Deploy production** → **Run workflow**.

Watch logs in the Actions tab. On the server: `pm2 logs nimalsafari`.

### 5. Align with your other projects

If other apps already use CI/CD, reuse the same:

- SSH user and key style
- `appleboy/ssh-action` or a self-hosted runner
- `/var/www/<project>` layout
- Only change **port**, **PM2 name**, and **Nginx server block**

Example: if another repo uses `DEPLOY_PATH=/var/www/myapp` and port `3002`, this app uses `/var/www/nimalsafari` and port `3010`.

---

## Part C — Hostinger-specific notes

- **Firewall:** In hPanel, allow inbound **80**, **443**, and **22** (SSH).
- **Stop using Vercel** for this app once VPS works — point DNS only to the VPS.
- **Backups:** Hostinger snapshots + cron tarball of `/var/lib/nimalsafari/data`.
- **Memory:** Next.js build needs ~1–2 GB RAM; if build fails on small VPS, build in CI and rsync `.next` (advanced) or temporarily add swap.

---

## Checklist after first CI/CD deploy

| Check | Expected |
|-------|----------|
| `https://nimalsafari.com` | Site loads |
| `/admin/login` | Google login works |
| `/api/admin/db-status` (logged in) | `"ephemeral": false`, `"driver": "payments:sqlite"` |
| Create payment link | 201, data in `/var/lib/nimalsafari/data` |
| `pm2 list` | `nimalsafari` online |

---

## Manual deploy (without CI/CD)

```bash
ssh USER@HOST
cd /var/www/nimalsafari
bash deploy/deploy.sh
```

---

## Related files

| File | Purpose |
|------|---------|
| `env.production.example` | Template for server `.env` (copy once locally on VPS) |
| `ecosystem.config.cjs` | PM2 process |
| `deploy/deploy.sh` | Pull, build, restart |
| `deploy/nginx-nimalsafari.conf` | Nginx reverse proxy |
| `docs/VPS-DEPLOY.md` | General VPS details |
