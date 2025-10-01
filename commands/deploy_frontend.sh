#!/bin/bash
set -e

APP_DIR="$( cd "$( dirname "$0" )/.." && pwd )"
FRONTEND_DIR="$APP_DIR/frontend"
DEPLOY_DIR="/var/www/flowuni"

echo "=================================================="
echo "🚀 Deploying Frontend (Vite React)"
echo "📂 Frontend source: $FRONTEND_DIR"
echo "📂 Deploy target:  $DEPLOY_DIR"
echo "=================================================="

# 1. Build frontend
cd "$FRONTEND_DIR"
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🏗️  Building production frontend..."
pnpm run build

# 2. Deploy to Nginx directory
echo "🗑️  Cleaning old files in $DEPLOY_DIR ..."
sudo rm -rf "$DEPLOY_DIR"/*
echo "📂 Copying new build..."
sudo cp -r dist/* "$DEPLOY_DIR"/

# 3. Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "=================================================="
echo "✅ Frontend deployed successfully!"
echo "🌐 Visit: https://flowuni.app"
echo "=================================================="
