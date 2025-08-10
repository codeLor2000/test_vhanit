# 🚗 Real-time GPS Tracking System

A real-time GPS vehicle tracking system with MQTT data streaming and interactive map tracking.

## 🚀 Quick Start

### Option 1: MySQL Database
```bash
# Start services
./setup.sh

# Access application
http://localhost:3000
```

### Option 2: Firebase Database
1. Create Firebase project at https://console.firebase.google.com
2. Create Firestore database
3. Generate service account key (JSON file)
4. Create `backend/.env`:
```env
DATABASE_TYPE=firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
```
5. Install dependencies: `cd backend && npm install firebase-admin dotenv`
6. Run: `./setup.sh`

## 🏗️ Project Structure
```
├── backend/
│   ├── index.js              # Main API server (SSE + REST)
│   ├── mqtt-listener.js      # MQTT data processor
│   ├── firebase-config.js    # Firebase operations
│   └── fake-data-generator.js # Real-time demo data
├── frontend/
│   ├── src/Dashboard.js      # Main dashboard (SSE)
│   └── src/MapView.js        # Vehicle map tracking
└── docker-compose.yml        # MySQL container
```

## ✨ Features
- **Real-time updates** via Server-Sent Events (SSE)
- **Interactive map tracking** with Google Maps integration
- **Dual database support** (MySQL/Firebase)
- **MQTT data streaming** for live GPS coordinates
- **Responsive web interface** with live status indicators

## 🗺️ Map Tracking
- Click "Track" button next to any vehicle
- View real-time location on interactive map
- Auto-refresh every 10 seconds
- One-click Google Maps integration

## 🛠️ Usage
1. **Start system**: `./setup.sh`
2. **View dashboard**: http://localhost:3000
3. **Track vehicle**: Click "🗺️ Track" button
4. **Stop system**: `./stop.sh`

## 📊 Data Flow
- **MQTT Broker** → `mqtt-listener.js` → **Database**
- **Database** → `index.js` (SSE) → **Frontend**
- **Demo Data**: `fake-data-generator.js` → **Firebase** (for testing)

## ⚙️ Configuration
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000
- **Database**: MySQL (port 3306) or Firebase
- **MQTT**: Configurable broker settings

## 🔄 Switching Databases
```bash
# MySQL mode
echo "DATABASE_TYPE=mysql" > backend/.env

# Firebase mode  
echo "DATABASE_TYPE=firebase" >> backend/.env
```

## 🚨 Troubleshooting
- **No data showing**: Check `fake-data-generator.js` is running
- **Connection issues**: Verify `.env` file configuration
- **Firebase errors**: Ensure service account key is valid 