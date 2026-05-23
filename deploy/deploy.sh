#!/usr/bin/env bash
# Run on the VPS after git pull (manual or CI/CD). Does not overwrite .env.
set -euo pipefail

APP_DIR="${DEPLOY_PATH:-/var/www/nimalsafari}"
PM2_NAME="${PM2_NAME:-nimalsafari}"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$APP_DIR"

echo "==> Deploy nimalsafari in $APP_DIR (branch $BRANCH)"

if [[ ! -f .env ]]; then
  echo "ERROR: Missing .env in $APP_DIR — create it once from env.production.example"
  exit 1
fi

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

npm ci
npm run build

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo "==> Done. Logs: pm2 logs $PM2_NAME"
