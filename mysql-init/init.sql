CREATE TABLE IF NOT EXISTS car_pos (
  rkey VARCHAR(50) NOT NULL,
  NAVERAPIKEY VARCHAR(50),
  MQTT_IP VARCHAR(30),
  MQTT_UserName VARCHAR(30),
  MQTT_Password VARCHAR(30),
  MQTT_TOPIC VARCHAR(50),
  car_id VARCHAR(50),
  car_name VARCHAR(100),
  expiredt VARCHAR(14),
  default_lat VARCHAR(20),
  default_lon VARCHAR(20),
  Latitude VARCHAR(20),
  Longitude VARCHAR(20),
  senddt VARCHAR(8),
  PRIMARY KEY (rkey)
);

INSERT INTO car_pos (rkey, NAVERAPIKEY, MQTT_IP, MQTT_UserName, MQTT_Password, MQTT_TOPIC, car_id, car_name, expiredt, default_lat, default_lon, Latitude, Longitude, senddt) VALUES
('sample1', 'key1', '1.2.3.4', 'user1', 'pass1', 'topic1', 'carid1', 'K3 195호4070', '20240601', '33.4996', '126.5312', '33.4996', '126.5312', '120000')
ON DUPLICATE KEY UPDATE rkey=rkey; 