const mqtt = require('mqtt');

const client  = mqtt.connect('mqtt://www.mjccp.kr', {
  username: 'mijuit',
  password: 'admin@123'
});

const topic = '/138-81-54417/test'; 

client.on('connect', function () {
  console.log('Connected to MQTT broker');
  setInterval(() => {
    const fakeData = `LAT=${(Math.random()*90).toFixed(6)};LNG=${(Math.random()*180).toFixed(6)};T1=${(20+Math.random()*10).toFixed(2)};SPD=${(Math.random()*100).toFixed(0)};CRS=${(Math.random()*360).toFixed(0)};TM=${Math.floor(Date.now()/1000).toString(16)}`;
    client.publish(topic, fakeData);
    console.log('Sent:', fakeData);
  }, 3000);
}); 