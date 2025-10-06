#!/bin/bash
set -e

PROJECT_NAME="flowuni"
APP_DIR="$( cd "$( dirname "$0" )/.." && pwd )"
COMPOSE_FILE="$APP_DIR/docker/docker-compose.prod.yml"

# Chọn màu: nếu BLUE đang chạy thì build GREEN, ngược lại build BLUE
if docker ps --format '{{.Names}}' | grep -q "${PROJECT_NAME}_app_blue"; then
    TARGET="green"
    OLD="blue"
else
    TARGET="blue"
    OLD="green"
fi

echo "=================================================="
echo "🚀 Blue-Green Deployment for $PROJECT_NAME"
echo "🟢 New target: $TARGET"
echo "🔵 Old version: $OLD"
echo "=================================================="

cd "$APP_DIR"

# Build và chạy container mới
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --build app_$TARGET celery-worker_$TARGET

# Healthcheck (simple: đợi 10s rồi curl /docs)
echo "⏳ Waiting for new app ($TARGET) to be ready..."
sleep 10
if ! curl -fs http://127.0.0.1:50${TARGET}1/docs >/dev/null; then
    echo "❌ New app ($TARGET) is not healthy, aborting switch."
    exit 1
fi

# Update nginx upstream
UPSTREAM_CONF="/etc/nginx/conf.d/upstream_backend.conf"
echo "upstream backend_upstream { server ${PROJECT_NAME}_app_${TARGET}:5001; }" | sudo tee $UPSTREAM_CONF
sudo nginx -s reload

echo "✅ Nginx switched to app_$TARGET"

# (Optional) stop old version
if docker ps --format '{{.Names}}' | grep -q "${PROJECT_NAME}_app_$OLD"; then
    echo "🛑 Stopping old app ($OLD)..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" stop app_$OLD celery-worker_$OLD
fi

echo "=================================================="
echo "🎉 Deployment finished! Now running on $TARGET"
echo "=================================================="
