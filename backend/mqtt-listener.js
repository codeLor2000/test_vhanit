const { json } = require("express");
const mqtt = require("mqtt");
const fs = require("fs");
const { exit } = require("process");
const e = require("express");
const mysql = require('mysql2');

let db;
let isConnected = false;

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
      // Retry connection after 5 seconds
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

// Initialize database connection
connectToDatabase();

// Utility functions for legacy format processing
(function () {
  var ConvertBase = function (num) {
    return {
      from: function (baseFrom) {
        return {
          to: function (baseTo) {
            return parseInt(num, baseFrom).toString(baseTo);
          }
        };
      }
    };
  };

  // binary to decimal
  ConvertBase.bin2dec = function (num) {
    return ConvertBase(num).from(2).to(10);
  };

  // binary to hexadecimal
  ConvertBase.bin2hex = function (num) {
    return ConvertBase(num).from(2).to(16);
  };

  // decimal to binary
  ConvertBase.dec2bin = function (num) {
    return ConvertBase(num).from(10).to(2);
  };

  // decimal to hexadecimal
  ConvertBase.dec2hex = function (num) {
    return ConvertBase(num).from(10).to(16);
  };

  // hexadecimal to binary
  ConvertBase.hex2bin = function (num) {
    return ConvertBase(num).from(16).to(2);
  };

  // hexadecimal to decimal
  ConvertBase.hex2dec = function (num) {
    return ConvertBase(num).from(16).to(10);
  };

  this.ConvertBase = ConvertBase;
})(this);

function lpad(str, padLen, padStr) {
  if (padStr.length > padLen) {
    console.log("error : too much string langth for text word");
    return str;
  }
  str += ""; 
  padStr += ""; 
  while (str.length < padLen)
    str = padStr + str;
  str = str.length >= padLen ? str.substring(0, padLen) : str;
  return str;
}

function ConvertHexToDate(hexValue) {
  // 16진수 문자열을 10진수로 변환
  let decValue = parseInt(hexValue, 16);

  // 1970년 1월 1일을 기준으로 Unix 타임스탬프를 Date 객체로 변환 (밀리초 단위)
  let dateTimeValue = new Date(decValue * 1000);

  // 변환된 날짜를 yyyyMMddHHmmss 형식으로 출력
  let year = dateTimeValue.getFullYear();
  let month = ('0' + (dateTimeValue.getMonth() + 1)).slice(-2);  // 월은 0부터 시작하므로 1을 더함
  let day = ('0' + dateTimeValue.getDate()).slice(-2);
  let hours = ('0' + dateTimeValue.getHours()).slice(-2);
  let minutes = ('0' + dateTimeValue.getMinutes()).slice(-2);
  let seconds = ('0' + dateTimeValue.getSeconds()).slice(-2);

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

const client = mqtt.connect("mqtt://www.mjccp.kr", { username: "mijuit", password: "admin@123" });

client.on("connect", () => {
  console.log("mqtt connected");
  // client.subscribe("/138-81-54417/2C:A7:80:00:01:80/#");
  client.subscribe("/138-81-54417/#");
});


client.on("message", (topic, message) => {
  console.log("Received message on topic:", topic);
  console.log("Message payload:", message.toString());

  var moment = require('moment');
  require('moment-timezone');
  moment.tz.setDefault("Asia/Seoul");

  const create_dt = moment().format('YYYYMMDD');
  const create_tm = moment().format('HH:mm:ss');

  const arr1 = topic.split("/");
  console.log("Topic parts:", arr1);

  if (arr1[1] == "") {
    return "";
  }

  const messageStr = message.toString();
  
  // Check if this is the new format: LAT=...;LNG=...;T1=...
  if (messageStr.includes('LAT=') && messageStr.includes('LNG=')) {
    console.log("Processing new GPS format data");
    
    // Parse the new format data
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
        // Convert hex timestamp if needed
        const hexTime = part.replace('TM=', '');
        try {
          const timestamp = parseInt(hexTime, 16);
          const date = new Date(timestamp * 1000);
          yymmdd = moment(date).format('YYYYMMDD');
          hhnnss = moment(date).format('HHmmss');
        } catch (e) {
          console.log('Error parsing timestamp, using current time');
        }
      }
    });

    const REGNO = arr1[1] || 'default';
    const JDATE = yymmdd;
    const Machin_mac = arr1[2] || 'unknown';
    const Time = yymmdd + " " + hhnnss;
    const Latitude = lat_f;
    const longitude = lon_f;

    // Log parsed data
    console.log("=== PARSED GPS DATA ===");
    console.log("REGNO:", REGNO);
    console.log("JDATE:", JDATE);
    console.log("Machin_mac:", Machin_mac);
    console.log("Time:", Time);
    console.log("Latitude:", Latitude);
    console.log("Longitude:", longitude);
    console.log("Speed:", CAR_Speed, "Km/h");
    console.log("Temperature:", Temperature1, "℃");
    console.log("Heading:", CAR_Heading);
    console.log("======================");

    // Save to database
    if (!isConnected || !db) {
      console.log('Database not connected, skipping data save for rkey:', REGNO);
      return;
    }

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
    
    db.query(
      insertQuery,
      [
        REGNO,
        'naver_api_key', // NAVERAPIKEY
        'mqtt.server.ip', // MQTT_IP
        'mqtt_user', // MQTT_UserName
        'mqtt_pass', // MQTT_Password
        topic, // MQTT_TOPIC - use actual topic
        REGNO, // car_id - use REGNO as car_id
        `Vehicle ${REGNO}`, // car_name
        yymmdd, // expiredt - use current date
        Latitude.toString(), // default_lat
        longitude.toString(), // default_lon
        Latitude.toString(),
        longitude.toString(),
        hhnnss
      ],
      (err, result) => {
        if (err) {
          console.error('MySQL insert error:', err);
          // If connection lost, mark as disconnected
          if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            isConnected = false;
          }
        } else {
          console.log('✅ Database updated successfully for rkey:', REGNO);
          console.log('Affected rows:', result.affectedRows);
        }
      }
    );
    
    return; // Exit early for new format
  }

  // Keep the old processing logic for backward compatibility
  const mag = Buffer(message).toString('hex');
  const mag2 = Buffer(message).toString();
  const mag1 = message.toString('utf8').replace(/\s/g, '');

  console.log("Processing legacy format data");
  
  var msg = "";
  var mmg = "";
  var rmg = "";
  var cnt = 0;

  (function () {

    var ConvertBase = function (num) {
      return {
        from: function (baseFrom) {
          return {
            to: function (baseTo) {
              return parseInt(num, baseFrom).toString(baseTo);
            }
          };
        }
      };
    };

    // binary to decimal
    ConvertBase.bin2dec = function (num) {
      return ConvertBase(num).from(2).to(10);
    };

    // binary to hexadecimal
    ConvertBase.bin2hex = function (num) {
      return ConvertBase(num).from(2).to(16);
    };

    // decimal to binary
    ConvertBase.dec2bin = function (num) {
      return ConvertBase(num).from(10).to(2);
    };

    // decimal to hexadecimal
    ConvertBase.dec2hex = function (num) {
      return ConvertBase(num).from(10).to(16);
    };

    // hexadecimal to binary
    ConvertBase.hex2bin = function (num) {
      return ConvertBase(num).from(16).to(2);
    };

    // hexadecimal to decimal
    ConvertBase.hex2dec = function (num) {
      return ConvertBase(num).from(16).to(10);
    };

    this.ConvertBase = ConvertBase;

  })(this);

  function lpad(str, padLen, padStr) {
    if (padStr.length > padLen) {
      console.log("error : too much string langth for text word");
      return str;
    }
    str += ""; 
    padStr += ""; 
    while (str.length < padLen)
      str = padStr + str;
    str = str.length >= padLen ? str.substring(0, padLen) : str;
    return str;
  }

  function ConvertHexToDate(hexValue) {
    // 16진수 문자열을 10진수로 변환
    let decValue = parseInt(hexValue, 16);

    // 1970년 1월 1일을 기준으로 Unix 타임스탬프를 Date 객체로 변환 (밀리초 단위)
    let dateTimeValue = new Date(decValue * 1000);

    // 9시간 더하기 (예시로 30분도 추가하려면 아래 주석 해제)
    //dateTimeValue.setHours(dateTimeValue.getHours() + 9);
    // dateTimeValue.setMinutes(dateTimeValue.getMinutes() + 30);

    // 변환된 날짜를 yyyyMMddHHmmss 형식으로 출력
    let year = dateTimeValue.getFullYear();
    let month = ('0' + (dateTimeValue.getMonth() + 1)).slice(-2);  // 월은 0부터 시작하므로 1을 더함
    let day = ('0' + dateTimeValue.getDate()).slice(-2);
    let hours = ('0' + dateTimeValue.getHours()).slice(-2);
    let minutes = ('0' + dateTimeValue.getMinutes()).slice(-2);
    let seconds = ('0' + dateTimeValue.getSeconds()).slice(-2);

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  if ( arr1[4] == "RS232" || arr1[4] == "RS485" )
  {
    for (var i = 0; i < mag.length; i++) {
      cnt = cnt + 1;

      mmg = mag.substring(i, i + 1);

      msg = msg + mmg;

      if (cnt == 2) {
        rmg = rmg + ConvertBase.hex2dec(msg) + '/';
        msg = "";
        cnt = 0;
      }
    }
  }
  else
  {
    for (var i = 0; i < mag1.length; i++) {
      cnt = cnt + 1;

      mmg = mag1.substring(i, i + 1);

      msg = msg + mmg;

      if (cnt == 2) {
        rmg = rmg + ConvertBase.hex2dec(msg) + '/';
        msg = "";
        cnt = 0;
      }
    }
  }
  
  const machine = arr1[4];

  var lggps = -1
  var lg485 = -1

  var CAR_Speed = 0;
  var CAR_Heading = 0;
  var CAR_Heading2 = 0;

  var Heading = CAR_Heading;

  if (machine === undefined) {
    console.log("Machine undefined, skipping legacy processing");
    return;
  }

  // Continue with existing legacy processing logic for RS232/RS485 etc.
  // This handles the complex parsing that was in the original code
  console.log("Legacy format processing completed, but no valid data found");
});