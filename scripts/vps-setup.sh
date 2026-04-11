#!/bin/bash
# =============================================================================
# VPS Setup Script — libhook.cloud
# Run once as root on a fresh Ubuntu 24.04 VPS
# Usage: bash scripts/vps-setup.sh
# =============================================================================
set -euo pipefail

REPO="https://github.com/nikhilfullstack3/library-system.git"
APP_DIR="/var/www/libhook"
DOMAIN="libhook.cloud"
API_DOMAIN="api.libhook.cloud"
PORT=5001

# ── Prompt for secrets ────────────────────────────────────────────────────────
echo ""
echo "=== Configuration ==="
read -p "MongoDB URI (from Atlas): " MONGODB_URI
read -p "Email for SSL certificate: " SSL_EMAIL

echo ""
echo "=== Starting setup ==="

# ── 1. System update ──────────────────────────────────────────────────────────
echo "[1/14] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Node.js 22 ─────────────────────────────────────────────────────────────
echo "[2/14] Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
apt-get install -y nodejs -qq

# ── 3. PM2 ───────────────────────────────────────────────────────────────────
echo "[3/14] Installing PM2..."
npm install -g pm2 --silent

# ── 4. Redis ─────────────────────────────────────────────────────────────────
echo "[4/14] Installing Redis..."
apt-get install -y redis-server -qq
systemctl enable redis-server
systemctl start redis-server

# ── 5. Nginx ─────────────────────────────────────────────────────────────────
echo "[5/14] Installing Nginx..."
apt-get install -y nginx -qq
systemctl enable nginx
systemctl start nginx

# ── 6. Certbot ───────────────────────────────────────────────────────────────
echo "[6/14] Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx -qq

# ── 7. Clone repo ────────────────────────────────────────────────────────────
echo "[7/14] Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
  echo "  Repo already cloned — pulling latest..."
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO" "$APP_DIR"
fi

# ── 8. Generate secrets & write server .env ───────────────────────────────────
echo "[8/14] Writing server .env..."
SESSION_SECRET=$(openssl rand -hex 32)
QR_SECRET=$(openssl rand -hex 16)

cat > "$APP_DIR/server/.env" << EOF
PORT=$PORT
MONGODB_URI=$MONGODB_URI
SESSION_SECRET=$SESSION_SECRET
QR_SECRET=$QR_SECRET
ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
REDIS_URL=redis://127.0.0.1:6379
RATE_LIMIT_PER_MINUTE=600
EOF

echo "  Secrets written. Keep server/.env safe — never commit it."

# ── 9. Install server dependencies ───────────────────────────────────────────
echo "[9/14] Installing server dependencies..."
cd "$APP_DIR/server"
npm ci --omit=dev --silent

# ── 10. Build client ──────────────────────────────────────────────────────────
echo "[10/14] Building React client..."
cd "$APP_DIR/client"
npm ci --silent
VITE_API_URL="https://$API_DOMAIN/api" npm run build --silent

# ── 11. PM2 ecosystem file ────────────────────────────────────────────────────
echo "[11/14] Writing PM2 ecosystem config..."
cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: "library-api",
      script: "./server/index.js",
      cwd: "/var/www/libhook",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
      error_file: "/var/log/pm2/library-api-error.log",
      out_file: "/var/log/pm2/library-api-out.log",
      merge_logs: true,
    },
  ],
};
EOF
mkdir -p /var/log/pm2

# ── 12. Nginx configs ─────────────────────────────────────────────────────────
echo "[12/14] Writing Nginx configs..."

cat > "/etc/nginx/sites-available/$API_DOMAIN" << EOF
server {
    listen 80;
    server_name $API_DOMAIN;

    # Max upload size (match server limit)
    client_max_body_size 6M;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;

        # WebSocket / Socket.IO support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_read_timeout 86400;
    }
}
EOF

cat > "/etc/nginx/sites-available/$DOMAIN" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/client/dist;
    index index.html;

    # React Router — all paths fall back to index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Long-cache for hashed assets
    location ~* \.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Never cache the HTML entry point
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF

ln -sf "/etc/nginx/sites-available/$API_DOMAIN" /etc/nginx/sites-enabled/
ln -sf "/etc/nginx/sites-available/$DOMAIN" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

# ── 13. SSL certificates ──────────────────────────────────────────────────────
echo "[13/14] Obtaining SSL certificates..."
certbot --nginx \
  -d "$DOMAIN" -d "www.$DOMAIN" -d "$API_DOMAIN" \
  --non-interactive --agree-tos \
  --email "$SSL_EMAIL" \
  --redirect

# ── 14. Start PM2 ────────────────────────────────────────────────────────────
echo "[14/14] Starting API with PM2..."
cd "$APP_DIR"
pm2 start ecosystem.config.js --env production
pm2 save

# Register PM2 to start on reboot
PM2_STARTUP=$(pm2 startup | grep "sudo" | tail -1)
eval "$PM2_STARTUP"

# ── Generate deploy SSH key for GitHub Actions ────────────────────────────────
echo ""
echo "=== Generating GitHub Actions deploy key ==="
mkdir -p /root/.ssh
if [ ! -f /root/.ssh/github_deploy ]; then
  ssh-keygen -t ed25519 -f /root/.ssh/github_deploy -N "" -C "github-actions-deploy"
  cat /root/.ssh/github_deploy.pub >> /root/.ssh/authorized_keys
  chmod 600 /root/.ssh/authorized_keys
fi

echo ""
echo "============================================================"
echo "  SETUP COMPLETE"
echo "============================================================"
echo ""
echo "  Web:  https://$DOMAIN"
echo "  API:  https://$API_DOMAIN/health"
echo ""
echo "  PM2 status:  pm2 list"
echo "  API logs:    pm2 logs library-api"
echo ""
echo "  ── GitHub Actions CI/CD ──────────────────────────────"
echo "  Add these 3 secrets to GitHub repo Settings > Secrets:"
echo ""
echo "  VPS_HOST     = 46.202.167.42"
echo "  VPS_USER     = root"
echo "  VPS_SSH_KEY  = (copy everything below, including header)"
echo ""
cat /root/.ssh/github_deploy
echo ""
echo "============================================================"
