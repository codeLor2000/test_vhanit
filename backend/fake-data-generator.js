const { firebaseOperations } = require('./firebase-config');
require('dotenv').config();

// Vehicle templates
const vehicles = [
  { id: 'vehicle001', name: 'Honda Civic 001', baseLat: 21.028511, baseLon: 105.804817 },
  { id: 'vehicle002', name: 'Toyota Camry 002', baseLat: 10.762622, baseLon: 106.660172 },
  { id: 'vehicle003', name: 'Mazda CX5 003', baseLat: 16.047079, baseLon: 108.206230 },
  { id: '138-81-54417', name: 'Vehicle 138-81-54417', baseLat: 44.723746, baseLon: 115.341678 }
];

function randomFloat(min, max, decimals = 6) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCurrentTime() {
  const now = new Date();
  const yymmdd = now.toISOString().slice(0, 10).replace(/-/g, '').slice(2); // YYMMDD
  const hhnnss = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
  return { yymmdd, hhnnss };
}

async function generateFakeData() {
  console.log('🚗 Generating fake GPS data...');
  
  try {
    for (const vehicle of vehicles) {
      const { yymmdd, hhnnss } = getCurrentTime();
      
      // Generate realistic movement (within 0.01 degree radius)
      const latOffset = randomFloat(-0.01, 0.01);
      const lonOffset = randomFloat(-0.01, 0.01);
      
      const vehicleData = {
        rkey: vehicle.id,
        NAVERAPIKEY: 'naver_api_key',
        MQTT_IP: 'mqtt.server.ip',
        MQTT_UserName: 'mqtt_user',
        MQTT_Password: 'mqtt_pass',
        MQTT_TOPIC: `test/${vehicle.id}/gps`,
        car_id: vehicle.id,
        car_name: vehicle.name,
        expiredt: `20${yymmdd}`,
        default_lat: (vehicle.baseLat + latOffset).toString(),
        default_lon: (vehicle.baseLon + lonOffset).toString(),
        Latitude: (vehicle.baseLat + latOffset).toString(),
        Longitude: (vehicle.baseLon + lonOffset).toString(),
        senddt: hhnnss,
        Temperature: randomInt(18, 35).toString(),
        Speed: randomInt(0, 120).toString(),
        Heading: randomInt(0, 359).toString()
      };

      const result = await firebaseOperations.saveVehicleData(vehicleData);
      
      if (result.success) {
        console.log(`✅ Updated ${vehicle.name}: Lat=${vehicleData.Latitude}, Lng=${vehicleData.Longitude}, Temp=${vehicleData.Temperature}°C`);
      } else {
        console.log(`❌ Failed to update ${vehicle.id}: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error generating fake data:', error);
  }
}

async function startFakeDataGenerator() {
  console.log('🔥 Starting fake GPS data generator...');
  console.log('📊 Database: Firebase');
  console.log('🔄 Update interval: 5 seconds');
  console.log('🚗 Vehicles: 4\n');
  
  // Generate initial data
  await generateFakeData();
  
  // Continue generating data every 5 seconds
  setInterval(async () => {
    await generateFakeData();
  }, 5000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping fake data generator...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping fake data generator...');
  process.exit(0);
});

startFakeDataGenerator(); 