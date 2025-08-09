const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let db;
let reconnectTimeout = 2000; // Start with 2 seconds
const maxReconnectTimeout = 30000; // Max 30 seconds
let isConnecting = false;

function handleDisconnect() {
  // Prevent multiple simultaneous connection attempts
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
      
      // Exponential backoff: increase timeout for next attempt
      reconnectTimeout = Math.min(reconnectTimeout * 1.5, maxReconnectTimeout);
      
      setTimeout(handleDisconnect, reconnectTimeout);
    } else {
      console.log('Connected to MySQL successfully');
      // Reset timeout on successful connection
      reconnectTimeout = 2000;
    }
  });

  db.on('error', function(err) {
    console.error('MySQL error:', err);
    
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      console.error('MySQL connection lost. Will attempt to reconnect...');
      // Don't immediately reconnect, wait a bit
      setTimeout(handleDisconnect, 5000);
    } else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_QUIT') {
      console.error('Cannot enqueue after quit. Will attempt to reconnect...');
      setTimeout(handleDisconnect, 5000);
    } else {
      // For other errors, don't automatically reconnect
      console.error('Fatal MySQL error:', err);
    }
  });
}

handleDisconnect();

app.get('/car_pos', (req, res) => {
  // Check if database connection exists
  if (!db) {
    return res.status(500).json({ 
      error: 'Database not connected',
      fallback: [
        {
          rkey: 'sample1',
          NAVERAPIKEY: 'key1',
          MQTT_IP: '1.2.3.4',
          MQTT_UserName: 'user1',
          MQTT_Password: 'pass1',
          MQTT_TOPIC: 'topic1',
          car_id: 'carid1',
          car_name: 'K3 195호4070',
          expiredt: '20240601',
          default_lat: '33.4996',
          default_lon: '126.5312',
          Latitude: '33.4996',
          Longitude: '126.5312',
          senddt: '120000'
        }
      ]
    });
  }

  db.query('SELECT * FROM car_pos', (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.json([
        {
          rkey: 'sample1',
          NAVERAPIKEY: 'key1',
          MQTT_IP: '1.2.3.4',
          MQTT_UserName: 'user1',
          MQTT_Password: 'pass1',
          MQTT_TOPIC: 'topic1',
          car_id: 'carid1',
          car_name: 'K3 195호4070',
          expiredt: '20240601',
          default_lat: '33.4996',
          default_lon: '126.5312',
          Latitude: '33.4996',
          Longitude: '126.5312',
          senddt: '120000'
        }
      ]);
    }
    res.json(results);
  });
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

  // Send initial data
  const sendData = () => {
    if (!db) {
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
        default_lat: '33.4996',
        default_lon: '126.5312',
        Latitude: '33.4996',
        Longitude: '126.5312',
        senddt: '120000'
      }];
      res.write(`data: ${JSON.stringify(fallbackData)}\n\n`);
      return;
    }

    db.query('SELECT * FROM car_pos', (err, results) => {
      if (err) {
        console.error('SSE Database query error:', err);
        return;
      }
      
      // Send data as SSE format
      res.write(`data: ${JSON.stringify(results)}\n\n`);
    });
  };

  // Send data immediately
  sendData();

  // Send data every 2 seconds
  const interval = setInterval(sendData, 2000);

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE client disconnected');
    clearInterval(interval);
  });

  req.on('error', (err) => {
    console.error('SSE error:', err);
    clearInterval(interval);
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 