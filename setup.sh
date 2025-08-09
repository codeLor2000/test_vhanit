#!/bin/bash

# 0. Install Dependencies for Backend and Frontend
cd backend
npm install
cd ../frontend
npm install
cd ..

# 1. start docker-compose (mysql, backend, frontend)
echo "[SETUP] Starting docker-compose..."
docker-compose up -d

# 2. run backend/index.js
echo "[SETUP] Starting backend/index.js..."
cd backend
nohup node index.js > ../backend-index.log 2>&1 &

# 3. run mqtt-listener.js
echo "[SETUP] Starting backend/mqtt-listener.js..."
nohup node mqtt-listener.js > ../mqtt-listener.log 2>&1 &

# 4. run fake-mqtt-pub.js
echo "[SETUP] Starting backend/fake-mqtt-pub.js..."
nohup node fake-mqtt-pub.js > ../fake-mqtt-pub.log 2>&1 &

# 5. run frontend
echo "[SETUP] Starting frontend..."
cd ../frontend
nohup npm start > ../frontend.log 2>&1 &

cd ..
echo "[SETUP] All services started. Check log files for output." 