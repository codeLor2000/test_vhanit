const { json } = require("express");
const mqtt = require("mqtt");
const fs = require("fs");
const { exit } = require("process");
const e = require("express");
const moment = require('moment');
require('dotenv').config();

// Import Firebase configuration
const { firebaseOperations } = require('./firebase-config');

// Check if we should use Firebase or MySQL
const useFirebase = process.env.DATABASE_TYPE === 'firebase';

let db = null;
let isConnected = false;

// MySQL setup (fallback)
if (!useFirebase) {
  const mysql = require('mysql2');

  function connectToDatabase() {
    db = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'test_vhanit',
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: false
    });

    db.connect((err) => {
      if (err) {
        console.error('MySQL connection error:', err.message);
        isConnected = false;
        setTimeout(connectToDatabase, 5000);
      } else {
        console.log('Connected to MySQL');
        isConnected = true;
      }
    });

    db.on('error', (err) => {
      console.error('MySQL error:', err);
      isConnected = false;
      
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.error('MySQL connection lost. Reconnecting...');
        setTimeout(connectToDatabase, 5000);
      } else {
        console.error('Fatal MySQL error:', err);
      }
    });
  }

  // Initialize MySQL connection
  connectToDatabase();
} else {
  console.log('🔥 MQTT Listener using Firebase as database');
  isConnected = true; // Firebase handles connection internally
}

// Utility functions for legacy format processing
function ConvertBase(num, to_base = 10, from_base = 10) {
  return parseInt(num, from_base).toString(to_base);
}

function lpad(str, length, padString = '0') {
  return str.toString().padStart(length, padString);
}

function ConvertHexToDate(hexString) {
  try {
    const timestamp = parseInt(hexString, 16);
    const date = new Date(timestamp * 1000);
    return {
      yymmdd: moment(date).format('YYYYMMDD'),
      hhnnss: moment(date).format('HHmmss')
    };
  } catch (error) {
    console.log('Error converting hex to date:', error);
    return {
      yymmdd: moment().format('YYYYMMDD'),
      hhnnss: moment().format('HHmmss')
    };
  }
}

// Database save function
async function saveVehicleData(vehicleData) {
  if (useFirebase) {
    // Use Firebase
    const result = await firebaseOperations.saveVehicleData(vehicleData);
    if (result.success) {
      console.log('✅ Firebase: Data saved for vehicle:', vehicleData.rkey);
    } else {
      console.error('❌ Firebase: Failed to save data:', result.error);
    }
    return result.success;
  } else {
    // Use MySQL
    if (!isConnected || !db) {
      console.log('Database not connected, skipping data save for rkey:', vehicleData.rkey);
      return false;
    }

    return new Promise((resolve) => {
      const insertQuery = `INSERT INTO car_pos 
        (rkey, NAVERAPIKEY, MQTT_IP, MQTT_UserName, MQTT_Password, MQTT_TOPIC, car_id, car_name, expiredt, default_lat, default_lon, Latitude, Longitude, senddt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          NAVERAPIKEY=VALUES(NAVERAPIKEY),
          MQTT_IP=VALUES(MQTT_IP),
          MQTT_UserName=VALUES(MQTT_UserName),
          MQTT_Password=VALUES(MQTT_Password),
          MQTT_TOPIC=VALUES(MQTT_TOPIC),
          car_id=VALUES(car_id),
          car_name=VALUES(car_name),
          expiredt=VALUES(expiredt),
          default_lat=VALUES(default_lat),
          default_lon=VALUES(default_lon),
          Latitude=VALUES(Latitude),
          Longitude=VALUES(Longitude),
          senddt=VALUES(senddt)`;

      const values = [
        vehicleData.rkey,
        vehicleData.NAVERAPIKEY || 'naver_api_key',
        vehicleData.MQTT_IP || 'mqtt.server.ip',
        vehicleData.MQTT_UserName || 'mqtt_user',
        vehicleData.MQTT_Password || 'mqtt_pass',
        vehicleData.MQTT_TOPIC,
        vehicleData.car_id,
        vehicleData.car_name,
        vehicleData.expiredt,
        vehicleData.default_lat,
        vehicleData.default_lon,
        vehicleData.Latitude,
        vehicleData.Longitude,
        vehicleData.senddt
      ];

      db.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error('MySQL insert error:', err);
          if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            isConnected = false;
          }
          resolve(false);
        } else {
          console.log('✅ MySQL: Database updated successfully for rkey:', vehicleData.rkey);
          console.log('Affected rows:', result.affectedRows);
          resolve(true);
        }
      });
    });
  }
}

// MQTT client setup
const client = mqtt.connect(process.env.MQTT_BROKER || "mqtt://www.mjccp.kr");

client.on("connect", function () {
  console.log("🔗 MQTT Connected to broker:", process.env.MQTT_BROKER || "mqtt://www.mjccp.kr");
  console.log("📊 Database:", useFirebase ? 'Firebase' : 'MySQL');
  
  client.subscribe("+/+/+", function (err) {
    if (!err) {
      console.log("📡 Subscribed to all topics (+/+/+)");
    } else {
      console.error("❌ MQTT subscription error:", err);
    }
  });
});

client.on("message", async function (topic, message) {
  const create_dt = moment().format('YYYYMMDD');
  const create_tm = moment().format('HH:mm:ss');
  
  console.log(`\n📨 Received message on topic: ${topic}`);
  console.log(`Message payload: ${message.toString()}`);

  const arr1 = topic.split("/");
  console.log("Topic parts:", arr1);

  if (arr1[1] == "") {
    return "";
  }

  const messageStr = message.toString();
  
  // Process new GPS format: LAT=...;LNG=...;T1=...
  if (messageStr.includes('LAT=') && messageStr.includes('LNG=')) {
    console.log("Processing new GPS format data");
    
    const dataParts = messageStr.split(';');
    let lat_f = 0, lon_f = 0, Temperature1 = 0, CAR_Speed = 0, CAR_Heading = 0;
    let yymmdd = create_dt, hhnnss = create_tm.replace(/:/g, '');

    dataParts.forEach(part => {
      if (part.startsWith('LAT=')) {
        lat_f = parseFloat(part.replace('LAT=', ''));
      } else if (part.startsWith('LNG=')) {
        lon_f = parseFloat(part.replace('LNG=', ''));
      } else if (part.startsWith('T1=')) {
        Temperature1 = parseFloat(part.replace('T1=', ''));
      } else if (part.startsWith('SPD=')) {
        CAR_Speed = parseInt(part.replace('SPD=', ''));
      } else if (part.startsWith('CRS=')) {
        CAR_Heading = parseInt(part.replace('CRS=', ''));
      } else if (part.startsWith('TM=')) {
        const hexTime = part.replace('TM=', '');
        try {
          const dateTime = ConvertHexToDate(hexTime);
          yymmdd = dateTime.yymmdd;
          hhnnss = dateTime.hhnnss;
        } catch (e) {
          console.log('Error parsing timestamp, using current time');
        }
      }
    });

    const vehicleData = {
      rkey: arr1[1] || 'default',
      NAVERAPIKEY: 'naver_api_key',
      MQTT_IP: 'mqtt.server.ip',
      MQTT_UserName: 'mqtt_user',
      MQTT_Password: 'mqtt_pass',
      MQTT_TOPIC: topic,
      car_id: arr1[1] || 'default',
      car_name: `Vehicle ${arr1[1] || 'default'}`,
      expiredt: yymmdd,
      default_lat: lat_f.toString(),
      default_lon: lon_f.toString(),
      Latitude: lat_f.toString(),
      Longitude: lon_f.toString(),
      senddt: hhnnss,
      Temperature: Temperature1.toString(),
      Speed: CAR_Speed.toString(),
      Heading: CAR_Heading.toString()
    };

    console.log("=== PARSED GPS DATA ===");
    console.log("REGNO:", vehicleData.rkey);
    console.log("JDATE:", vehicleData.expiredt);
    console.log("Machin_mac:", arr1[2] || 'unknown');
    console.log("Time:", yymmdd + " " + hhnnss);
    console.log("Latitude:", lat_f);
    console.log("Longitude:", lon_f);
    console.log("Speed:", CAR_Speed, "Km/h");
    console.log("Temperature:", Temperature1, "℃");
    console.log("Heading:", CAR_Heading);
    console.log("======================");

    // Save to database
    await saveVehicleData(vehicleData);
    return;
  }

  // Keep the old processing logic for backward compatibility
  console.log("Processing legacy format data");
  const mag = Buffer(message).toString('hex');
  const mag2 = Buffer(message).toString();
  const mag1 = message.toString('utf8').replace(/\s/g, '');
  
  console.log("Legacy format processing completed, but no valid data found");
});

client.on("error", function (error) {
  console.error("❌ MQTT connection error:", error);
});

client.on("close", function () {
  console.log("🔌 MQTT connection closed");
});

client.on("reconnect", function () {
  console.log("🔄 MQTT reconnecting...");
});

console.log("🚀 MQTT Listener started");
console.log("📊 Database:", useFirebase ? 'Firebase' : 'MySQL');
console.log("📡 Broker:", process.env.MQTT_BROKER || "mqtt://www.mjccp.kr");