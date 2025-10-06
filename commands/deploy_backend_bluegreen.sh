#!/bin/bash
set -e

PROJECT_NAME="flowuni"
APP_DIR="$( cd "$( dirname "$0" )/.." && pwd )"
COMPOSE_FILE="$APP_DIR/docker/docker-compose.prod.yml"
UPSTREAM_CONF="/etc/nginx/conf.d/upstream_backend.conf"

# Ensure nginx can reach Docker containers
# (Only needed once, but safe to run multiple times)
if ! docker network inspect ${PROJECT_NAME}_app_network >/dev/null 2>&1; then
    echo "⚠️  Network ${PROJECT_NAME}_app_network does not exist!"
    exit 1
fi

# Check current running state
BLUE_RUNNING=$(docker ps --format '{{.Names}}' | grep -c "${PROJECT_NAME}_app_blue" || true)
GREEN_RUNNING=$(docker ps --format '{{.Names}}' | grep -c "${PROJECT_NAME}_app_green" || true)

# Handle edge cases
if [ "$BLUE_RUNNING" -gt 0 ] && [ "$GREEN_RUNNING" -gt 0 ]; then
    echo "⚠️  WARNING: Both blue and green are currently running!"
    echo "Current state:"
    docker ps --filter "name=${PROJECT_NAME}_app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "Please choose an action:"
    echo "1) Keep BLUE, deploy to GREEN (stop blue after)"
    echo "2) Keep GREEN, deploy to BLUE (stop green after)"
    echo "3) Stop both and start fresh with BLUE"
    echo "4) Abort"
    read -p "Enter choice [1-4]: " choice
    
    case $choice in
        1) TARGET="green"; OLD="blue" ;;
        2) TARGET="blue"; OLD="green" ;;
        3)
            echo "🛑 Stopping both versions..."
            docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" stop app_blue celery-worker_blue app_green celery-worker_green
            TARGET="blue"; OLD="green"
            ;;
        4) echo "❌ Deployment aborted."; exit 0 ;;
        *) echo "❌ Invalid choice. Aborting."; exit 1 ;;
    esac
elif [ "$BLUE_RUNNING" -gt 0 ]; then
    TARGET="green"; OLD="blue"
elif [ "$GREEN_RUNNING" -gt 0 ]; then
    TARGET="blue"; OLD="green"
else
    echo "ℹ️  No version currently running. Starting with blue."
    TARGET="blue"; OLD="green"
fi

echo "=================================================="
echo "🚀 Blue-Green Deployment for $PROJECT_NAME"
echo "🟢 New target: $TARGET"
echo "🔵 Old version: $OLD"
echo "=================================================="

cd "$APP_DIR"

# Build and start new containers
echo "📦 Building and starting $TARGET containers..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --build app_$TARGET celery-worker_$TARGET

# Health check
echo "⏳ Waiting for new app ($TARGET) to be ready..."
sleep 30

if [ "$TARGET" = "blue" ]; then
    PORT=5001
else
    PORT=5002
fi

echo "🏥 Performing health check on port $PORT..."
MAX_RETRIES=12
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -fs http://127.0.0.1:$PORT/docs >/dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "❌ Health check failed after $MAX_RETRIES attempts"
        docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs --tail=50 app_$TARGET
        exit 1
    fi
    
    echo "⏳ Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 5
done

# Update nginx upstream to point to Docker container
# Update nginx upstream to point to host port
echo "🔄 Updating nginx upstream to $TARGET..."
if [ "$TARGET" = "blue" ]; then
    UPSTREAM_PORT=5001
else
    UPSTREAM_PORT=5002
fi

echo "upstream backend_upstream { server 127.0.0.1:${UPSTREAM_PORT}; }" | sudo tee $UPSTREAM_CONF > /dev/null

# Test and reload nginx
echo "🧪 Testing nginx configuration..."
if ! sudo nginx -t; then
    echo "❌ Nginx configuration test failed!"
    # Rollback
    if [ "$OLD" = "blue" ]; then
        ROLLBACK_PORT=5001
    else
        ROLLBACK_PORT=5002
    fi
    echo "upstream backend_upstream { server 127.0.0.1:${ROLLBACK_PORT}; }" | sudo tee $UPSTREAM_CONF > /dev/null
    exit 1
fi

sudo nginx -s reload
echo "✅ Nginx switched to app_$TARGET (port $UPSTREAM_PORT)"

# Verify through production
echo "🔍 Verifying deployment..."
sleep 3
if curl -fs https://api.flowuni.app/docs >/dev/null 2>&1; then
    echo "✅ Production verification successful!"
else
    echo "⚠️  Warning: Could not verify through production URL"
fi

# Stop old version
if docker ps --format '{{.Names}}' | grep -q "${PROJECT_NAME}_app_$OLD"; then
    echo "🛑 Stopping old app ($OLD)..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" stop app_$OLD celery-worker_$OLD
    echo "✅ Old version stopped"
fi

echo "=================================================="
echo "🎉 Deployment finished! Now running on $TARGET"
echo "=================================================="
echo ""
echo "📊 Current status:"
docker ps --filter "name=${PROJECT_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📝 Quick rollback:"
echo "   echo 'upstream backend_upstream { server ${PROJECT_NAME}_app_${OLD}:5001; }' | sudo tee $UPSTREAM_CONF && sudo nginx -s reload"
