#!/bin/bash

echo "[STOP] Stopping docker-compose containers..."
docker-compose down

echo "[STOP] Killing node index.js..."
pkill -f "node index.js"
echo "[STOP] Killing node mqtt-listener.js..."
pkill -f "node mqtt-listener.js"
echo "[STOP] Killing node fake-mqtt-pub.js..."
pkill -f "node fake-mqtt-pub.js"
echo "[STOP] Killing frontend (React dev server)..."
pkill -f "react-scripts/scripts/start.js"
pkill -f "npm start"

echo "[STOP] All services stopped." 