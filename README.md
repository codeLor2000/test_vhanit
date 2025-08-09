# 🚗 Real-time GPS Tracking System

A real-time GPS tracking system that receives GPS data via MQTT, stores it in MySQL database, and displays it on a React frontend with auto-refresh.

## ✨ Features

- **Real-time GPS tracking** via MQTT protocol
- **Auto-refresh frontend** every 3 seconds
- **MySQL database** for data persistence
- **Fake data generator** for testing
- **Modern React UI** with visual indicators

## 📁 Project Structure

```
test_vhanit/
├── backend/
│   ├── index.js                # API server (Port 3001)
│   ├── mqtt-listener.js        # MQTT subscriber & GPS parser
│   ├── fake-mqtt-pub.js        # Fake GPS data generator
│   └── package.json
├── frontend/
│   ├── src/App.js             # React component with auto-refresh
│   └── package.json
├── mysql-init/init.sql        # Database schema
├── docker-compose.yml         # MySQL container
├── setup.sh                  # Start all services
└── stop.sh                   # Stop all services
```

## 🔧 Prerequisites

- **Node.js** (v16+)
- **Docker** & **Docker Compose**

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Backend
cd backend && npm install && cd ..

# Frontend  
cd frontend && npm install && cd ..
```

### 2. Run Application
```bash
# Start everything automatically
chmod +x setup.sh
./setup.sh
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/car_pos

### 4. Stop Services
```bash
chmod +x stop.sh
./stop.sh
```

## 📊 Data Flow

1. **MQTT Data**: `LAT=46.046816;LNG=143.959093;T1=26.3;SPD=10`
2. **Parse & Store**: GPS data → MySQL database  
3. **API**: Backend serves data via REST API
4. **Frontend**: React auto-refreshes every 3 seconds

## 🧪 Testing with Fake Data

The system includes a fake GPS data generator that:
- Generates random coordinates
- Simulates vehicle movement  
- Includes temperature and speed data
- Auto-publishes to MQTT every 3 seconds

## 🐛 Troubleshooting

```bash
# Check services
docker ps                              # MySQL container
curl http://localhost:3001/car_pos     # Backend API
tail -f mqtt-listener.log              # MQTT processing

# Restart if needed
./stop.sh && ./setup.sh
```

## ⚙️ Configuration

- **MQTT Broker**: `mqtt://www.mjccp.kr`
- **Database**: MySQL on Docker (localhost:3306)
- **Polling Interval**: 3 seconds
- **API Port**: 3001
- **Frontend Port**: 3000

**Happy tracking!** 🚗📍 