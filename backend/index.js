const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Import Firebase configuration
const { firebaseOperations } = require('./firebase-config');

// Check if we should use Firebase or MySQL
const useFirebase = process.env.DATABASE_TYPE === 'firebase';

let db = null;
let isConnected = false;

// MySQL setup (fallback)
if (!useFirebase) {
  const mysql = require('mysql2');
  let reconnectTimeout = 2000;
  const maxReconnectTimeout = 30000;
  let isConnecting = false;

  function handleDisconnect() {
    if (isConnecting) {
      console.log('Connection attempt already in progress, skipping...');
      return;
    }

    isConnecting = true;
    console.log('Attempting to connect to MySQL...');

    db = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'test_vhanit',
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: false
    });

    db.connect(function(err) {
      isConnecting = false;
      
      if (err) {
        console.error('MySQL connection error:', err.message);
        console.log(`Retrying in ${reconnectTimeout/1000} seconds...`);
        reconnectTimeout = Math.min(reconnectTimeout * 1.5, maxReconnectTimeout);
        setTimeout(handleDisconnect, reconnectTimeout);
      } else {
        console.log('Connected to MySQL successfully');
        isConnected = true;
        reconnectTimeout = 2000;
      }
    });

    db.on('error', function(err) {
      console.error('MySQL error:', err);
      isConnected = false;
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.error('MySQL connection lost. Will attempt to reconnect...');
        setTimeout(handleDisconnect, 5000);
      } else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_QUIT') {
        console.error('Cannot enqueue after quit. Will attempt to reconnect...');
        setTimeout(handleDisconnect, 5000);
      } else {
        console.error('Fatal MySQL error:', err);
      }
    });
  }

  // Initialize MySQL connection
  handleDisconnect();
} else {
  console.log('🔥 Using Firebase as database');
  isConnected = true; // Firebase handles connection internally
}

// API endpoint to get car positions
app.get('/car_pos', async (req, res) => {
  try {
    if (useFirebase) {
      // Use Firebase
      let vehicles = [];
      
      try {
        vehicles = await firebaseOperations.getAllVehicles();
      } catch (firebaseError) {
        console.log('Firebase connection failed, using demo data');
        vehicles = [];
      }
      
      // Add sample data if no vehicles exist or Firebase failed
      if (vehicles.length === 0) {
        const sampleData = [
          {
            rkey: 'vehicle001',
            NAVERAPIKEY: 'key1',
            MQTT_IP: '1.2.3.4',
            MQTT_UserName: 'user1',
            MQTT_Password: 'pass1',
            MQTT_TOPIC: 'test/vehicle001/gps',
            car_id: 'vehicle001',
            car_name: 'Honda Civic 001',
            expiredt: '20250110',
            default_lat: '21.028511',
            default_lon: '105.804817',
            Latitude: '21.028511',
            Longitude: '105.804817',
            senddt: '102530',
            Temperature: '24'
          },
          {
            rkey: 'vehicle002',
            NAVERAPIKEY: 'key2',
            MQTT_IP: '1.2.3.4',
            MQTT_UserName: 'user1',
            MQTT_Password: 'pass1',
            MQTT_TOPIC: 'test/vehicle002/gps',
            car_id: 'vehicle002',
            car_name: 'Toyota Camry 002',
            expiredt: '20250110',
            default_lat: '10.762622',
            default_lon: '106.660172',
            Latitude: '10.762622',
            Longitude: '106.660172',
            senddt: '102545',
            Temperature: '26'
          },
          {
            rkey: 'vehicle003',
            NAVERAPIKEY: 'key3',
            MQTT_IP: '1.2.3.4',
            MQTT_UserName: 'user1',
            MQTT_Password: 'pass1',
            MQTT_TOPIC: 'test/vehicle003/gps',
            car_id: 'vehicle003',
            car_name: 'Mazda CX5 003',
            expiredt: '20250110',
            default_lat: '16.047079',
            default_lon: '108.206230',
            Latitude: '16.047079',
            Longitude: '108.206230',
            senddt: '102600',
            Temperature: '22'
          },
          {
            rkey: '138-81-54417',
            NAVERAPIKEY: 'key4',
            MQTT_IP: '1.2.3.4',
            MQTT_UserName: 'user1',
            MQTT_Password: 'pass1',
            MQTT_TOPIC: 'test/138-81-54417/gps',
            car_id: '138-81-54417',
            car_name: 'Vehicle 138-81-54417',
            expiredt: '20250110',
            default_lat: '44.723746',
            default_lon: '115.341678',
            Latitude: '44.723746',
            Longitude: '115.341678',
            senddt: '103000',
            Temperature: '25'
          }
        ];
        
        // Try to save sample data to Firebase (will fail gracefully if no real credentials)
        for (const vehicle of sampleData) {
          try {
            await firebaseOperations.saveVehicleData(vehicle);
          } catch (e) {
            // Ignore Firebase save errors for demo data
          }
        }
        
        vehicles = sampleData;
      }
      
      res.json(vehicles);
    } else {
      // Use MySQL
      if (!db || !isConnected) {
        console.log('Database not connected, returning sample data');
        return res.json([{
          rkey: 'sample1',
          NAVERAPIKEY: 'key1',
          MQTT_IP: '1.2.3.4',
          MQTT_UserName: 'user1',
          MQTT_Password: 'pass1',
          MQTT_TOPIC: 'topic1',
          car_id: 'carid1',
          car_name: 'K3 195호4070',
          expiredt: '20240601',
          default_lat: '37.7749',
          default_lon: '-122.4194',
          Latitude: '37.7749',
          Longitude: '-122.4194',
          senddt: '143025'
        }]);
      }

      db.query('SELECT * FROM car_pos', (err, results) => {
        if (err) {
          console.error('MySQL query error:', err);
          return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
      });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Server-Sent Events endpoint for real-time updates
app.get('/car_pos/stream', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  console.log('📡 SSE client connected');

  // Send initial data immediately
  const sendData = async () => {
    try {
      if (useFirebase) {
        const vehicles = await firebaseOperations.getAllVehicles();
        res.write(`data: ${JSON.stringify(vehicles)}\n\n`);
      } else {
        if (!db || !isConnected) {
          const fallbackData = [{
            rkey: 'sample1',
            NAVERAPIKEY: 'key1',
            MQTT_IP: '1.2.3.4',
            MQTT_UserName: 'user1',
            MQTT_Password: 'pass1',
            MQTT_TOPIC: 'topic1',
            car_id: 'carid1',
            car_name: 'K3 195호4070',
            expiredt: '20240601',
            default_lat: '37.7749',
            default_lon: '-122.4194',
            Latitude: '37.7749',
            Longitude: '-122.4194',
            senddt: '143025'
          }];
          res.write(`data: ${JSON.stringify(fallbackData)}\n\n`);
          return;
        }

        db.query('SELECT * FROM car_pos', (err, results) => {
          if (err) {
            console.error('SSE Database query error:', err);
            return;
          }
          res.write(`data: ${JSON.stringify(results)}\n\n`);
        });
      }
    } catch (error) {
      console.error('SSE error:', error);
    }
  };

  // Send data immediately
  sendData();

  // Send data every 2 seconds (faster than polling)
  const interval = setInterval(sendData, 2000);

  // Handle client disconnect
  req.on('close', () => {
    console.log('📡 SSE client disconnected');
    clearInterval(interval);
  });

  req.on('error', (err) => {
    console.error('SSE connection error:', err);
    clearInterval(interval);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const status = {
    status: 'OK',
    database: useFirebase ? 'Firebase' : 'MySQL',
    connected: isConnected,
    timestamp: new Date().toISOString()
  };
  res.json(status);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: ${useFirebase ? 'Firebase' : 'MySQL'}`);
  console.log(`🔗 API: http://localhost:${PORT}/car_pos`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
}); 