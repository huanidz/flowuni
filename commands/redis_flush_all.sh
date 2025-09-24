#!/bin/bash

CONTAINER_NAME="flowuni-redis-service-1"

echo "=================================================="
echo "🔍 Verbose Redis data deletion starting..."
echo "Target container: $CONTAINER_NAME"
echo "=================================================="

# Step 1: Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
  echo "❌ Error: Container '$CONTAINER_NAME' is not running!"
  exit 1
fi

# Step 2: List all keys
echo "➡️  Fetching all keys..."
KEYS=$(docker exec -i $CONTAINER_NAME redis-cli KEYS "*")

if [ -z "$KEYS" ]; then
  echo "✅ No keys found. Database is already empty."
  exit 0
fi

echo "🔑 Keys to delete:"
echo "$KEYS"
echo "--------------------------------------------------"

# Step 3: Delete keys one by one with progress
COUNT=0
for KEY in $KEYS; do
  echo "❌ Deleting key: $KEY"
  docker exec -i $CONTAINER_NAME redis-cli DEL "$KEY" > /dev/null
  COUNT=$((COUNT + 1))
done

echo "--------------------------------------------------"
echo "✅ Deleted $COUNT keys from Redis."
echo "➡️  Checking final DB size..."
docker exec -i $CONTAINER_NAME redis-cli DBSIZE

echo "=================================================="
echo "🎉 Verbose Redis flush complete."
echo "=================================================="
