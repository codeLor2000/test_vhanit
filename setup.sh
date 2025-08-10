#!/bin/bash

# 0. Install Dependencies for Backend and Frontend
cd backend
npm install
cd ../frontend
npm install
cd ..

# Check if using Firebase or MySQL
if [ -f backend/.env ]; then
    DATABASE_TYPE=$(grep "DATABASE_TYPE" backend/.env | cut -d '=' -f2)
else
    DATABASE_TYPE="mysql"
fi

if [ "$DATABASE_TYPE" = "firebase" ]; then
    echo "[SETUP] Using Firebase - skipping Docker..."
else
    # 1. start docker-compose (mysql, backend, frontend)
    echo "[SETUP] Starting docker-compose..."
    docker-compose up -d
fi

# 2. run backend/index.js
echo "[SETUP] Starting backend/index.js..."
cd backend
nohup node index.js > ../backend-index.log 2>&1 &

# 3. run mqtt-listener.js
echo "[SETUP] Starting backend/mqtt-listener.js..."
nohup node mqtt-listener.js > ../mqtt-listener.log 2>&1 &

if [ "$DATABASE_TYPE" = "firebase" ]; then
    # 4a. run fake-data-generator.js for Firebase
    echo "[SETUP] Starting backend/fake-data-generator.js..."
    nohup node fake-data-generator.js > ../fake-data-generator.log 2>&1 &
else
    # 4b. run fake-mqtt-pub.js for MySQL
    echo "[SETUP] Starting backend/fake-mqtt-pub.js..."
    nohup node fake-mqtt-pub.js > ../fake-mqtt-pub.log 2>&1 &
fi

# 5. run frontend
echo "[SETUP] Starting frontend..."
cd ../frontend
nohup npm start > ../frontend.log 2>&1 &

cd ..
echo "[SETUP] All services started. Check log files for output." 