#!/bin/bash
set -euo pipefail

# ============================================================================
# ArabiQ Beta Deployment Script
# Target: ahmed@72.60.33.37 → /srv/beta.arabiq.tech
# ============================================================================

REMOTE="ahmed@72.60.33.37"
REMOTE_DIR="/srv/beta.arabiq.tech"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()  { echo -e "\n${GREEN}━━━ $* ━━━${NC}"; }

# ── Step 1: Sync code to server ─────────────────────────────────────────────
step "1/5  Syncing code to server"

rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.tmp' \
  --exclude='.cache' \
  --exclude='.strapi' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.env.local' \
  --exclude='.logs' \
  --exclude='.run' \
  --exclude='tmp/' \
  --exclude='backups/' \
  --exclude='raw/' \
  --exclude='*.log' \
  "$LOCAL_DIR/" "${REMOTE}:${REMOTE_DIR}/"

info "Code synced"

# ── Step 2: Build & start containers on server ──────────────────────────────
step "2/5  Building Docker images on server (this takes a few minutes)"

ssh "$REMOTE" << 'DEPLOY'
set -euo pipefail
cd /srv/beta.arabiq.tech

# Export build args from env files for docker compose
export STRAPI_API_TOKEN=$(grep STRAPI_API_TOKEN deploy/web.env | cut -d= -f2-)
export NEXT_PUBLIC_MATTERPORT_SDK_KEY=$(grep NEXT_PUBLIC_MATTERPORT_SDK_KEY deploy/web.env | cut -d= -f2-)

echo "[INFO] Building CMS image..."
docker compose build cms 2>&1 | tail -5

echo "[INFO] Building Web image..."
docker compose build web 2>&1 | tail -5

echo "[INFO] Starting containers..."
docker compose up -d 2>&1

echo "[INFO] Waiting for CMS health..."
for i in $(seq 1 60); do
  if docker compose exec -T cms wget -q --spider http://localhost:1337/admin/init 2>/dev/null; then
    echo "[INFO] CMS healthy ✓"
    break
  fi
  if [ "$i" = "60" ]; then
    echo "[WARN] CMS health check timed out, check logs"
  fi
  sleep 3
done

echo "[INFO] Container status:"
docker compose ps
DEPLOY

info "Containers deployed"

# ── Step 3: SSL certificates ────────────────────────────────────────────────
step "3/5  Setting up SSL certificates"

ssh "$REMOTE" << 'SSL'
set -euo pipefail

# Install HTTP-only nginx configs first (for certbot challenge)
for domain in beta.arabiq.tech cms.arabiq.tech; do
  conf="/etc/nginx/sites-available/$domain"
  if [ ! -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
    echo "[INFO] Getting SSL cert for $domain..."

    # Temporary HTTP-only config for certbot
    sudo tee "$conf" > /dev/null << TMPCONF
server {
    listen 80;
    server_name $domain;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 200 'waiting for ssl'; add_header Content-Type text/plain; }
}
TMPCONF
    sudo ln -sf "$conf" "/etc/nginx/sites-enabled/$domain"
    sudo nginx -t && sudo systemctl reload nginx

    # Get certificate
    sudo certbot certonly --webroot -w /var/www/html -d "$domain" --non-interactive --agree-tos --email admin@arabiq.tech || {
      echo "[WARN] certbot failed for $domain - will need manual SSL setup"
    }
  else
    echo "[INFO] SSL cert already exists for $domain"
  fi
done
SSL

info "SSL setup done"

# ── Step 4: Install final nginx configs ─────────────────────────────────────
step "4/5  Installing Nginx configs"

ssh "$REMOTE" << 'NGINX'
set -euo pipefail
cd /srv/beta.arabiq.tech

# Only install full configs if SSL certs exist
for pair in "cms:nginx-cms.conf:cms.arabiq.tech" "web:nginx-web.conf:beta.arabiq.tech"; do
  IFS=: read -r name file domain <<< "$pair"
  
  if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
    echo "[INFO] Installing nginx config for $domain"
    sudo cp "deploy/$file" "/etc/nginx/sites-available/$domain"
    sudo ln -sf "/etc/nginx/sites-available/$domain" "/etc/nginx/sites-enabled/$domain"
  else
    echo "[WARN] No SSL cert for $domain, keeping HTTP-only config"
  fi
done

sudo nginx -t && sudo systemctl reload nginx
echo "[INFO] Nginx configured ✓"
NGINX

info "Nginx configured"

# ── Step 5: Verify ──────────────────────────────────────────────────────────
step "5/5  Verifying deployment"

ssh "$REMOTE" << 'VERIFY'
echo "=== Docker Containers ==="
docker compose -f /srv/beta.arabiq.tech/docker-compose.yml ps

echo ""
echo "=== Health Checks ==="
printf "CMS (localhost:1337): "
curl -sf http://127.0.0.1:1337/admin/init > /dev/null 2>&1 && echo "✓ OK" || echo "✗ FAIL"
printf "Web (localhost:3000): "
curl -sf http://127.0.0.1:3000 > /dev/null 2>&1 && echo "✓ OK" || echo "✗ FAIL"

echo ""
echo "=== Public URLs ==="
printf "https://beta.arabiq.tech: "
curl -sf -o /dev/null -w "%{http_code}" https://beta.arabiq.tech 2>/dev/null || echo "not yet"
echo ""
printf "https://cms.arabiq.tech: "
curl -sf -o /dev/null -w "%{http_code}" https://cms.arabiq.tech 2>/dev/null || echo "not yet"
echo ""
VERIFY

echo ""
info "Deployment complete!"
echo ""
echo "  🌐  Web:  https://beta.arabiq.tech"
echo "  📦  CMS:  https://cms.arabiq.tech/admin"
echo ""
echo "  Useful commands (on server):"
echo "    cd $REMOTE_DIR && docker compose logs -f cms"
echo "    cd $REMOTE_DIR && docker compose logs -f web"
echo "    cd $REMOTE_DIR && docker compose restart"
echo ""
