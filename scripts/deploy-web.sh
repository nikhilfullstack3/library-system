#!/bin/bash
# Called by GitHub Actions on every push to main that changes client/**
set -euo pipefail

APP_DIR="/var/www/libhook"
API_DOMAIN="api.libhook.cloud"

echo "=== Web client deploy started ==="

cd "$APP_DIR"

echo "[1/3] Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo "[2/3] Installing client dependencies..."
cd "$APP_DIR/client"
npm ci --silent

echo "[3/3] Building React client..."
VITE_API_URL="https://$API_DOMAIN/api" npm run build --silent

echo "=== Web deploy complete — Nginx serves the new build immediately ==="
