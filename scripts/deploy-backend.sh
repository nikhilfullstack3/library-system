#!/bin/bash
# Called by GitHub Actions on every push to main that changes server/**
set -euo pipefail

APP_DIR="/var/www/libhook"

echo "=== Backend deploy started ==="

cd "$APP_DIR"

echo "[1/3] Pulling latest code..."
git fetch --force origin main
git reset --hard origin/main

echo "[2/3] Installing server dependencies..."
cd "$APP_DIR/server"
npm ci --omit=dev --silent

echo "[3/3] Reloading PM2 (zero-downtime)..."
cd "$APP_DIR"
pm2 reload ecosystem.config.js --env production --update-env

echo "=== Backend deploy complete ==="
pm2 list
