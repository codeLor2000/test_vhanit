import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3001/car_pos');
      setData(response.data);
      setLastUpdate(new Date());
      setIsOnline(true);
      setUpdateCount(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    fetchData();

    intervalRef.current = setInterval(fetchData, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (date) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString('vi-VN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit', 
      second: '2-digit'
    });
  };

  return (
    <div className="App" style={{ padding: 24 }}>
      {/* Status Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20,
        padding: 12,
        backgroundColor: isOnline ? '#e8f5e8' : '#ffe8e8',
        borderRadius: 8,
        border: `2px solid ${isOnline ? '#4caf50' : '#f44336'}`
      }}>
        <h2 style={{ margin: 0 }}>🚗 Real-time GPS Tracking</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            fontSize: 14
          }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: isOnline ? '#4caf50' : '#f44336',
              animation: isOnline ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span>{isOnline ? 'LIVE' : 'OFFLINE'}</span>
            <span style={{ color: '#666', fontSize: 12 }}>
              (Auto-refresh every 3s)
            </span>
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            Last Update: {formatTime(lastUpdate)}
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            Updates: {updateCount}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div style={{ overflowX: 'auto' }}>
        <table border="1" cellPadding="12" style={{ 
          borderCollapse: 'collapse', 
          width: '100%',
          fontSize: 14
        }}>
          <thead style={{ backgroundColor: '#f5f5f5' }}>
            <tr>
              <th>🆔 Vehicle ID</th>
              <th>🚗 Car Name</th>
              <th>📍 Current Position</th>
              <th>🌡️ Temperature</th>
              <th>📡 MQTT Topic</th>
              <th>⏰ Last Seen</th>
              <th>🔗 Track Link</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const isRealTime = row.rkey !== 'sample1';
              return (
                <tr key={row.rkey || idx} style={{
                  backgroundColor: isRealTime ? '#f0fff0' : '#fff8f0',
                  animation: isRealTime && updateCount > 1 ? 'highlight 1s ease-out' : 'none'
                }}>
                  <td style={{ fontWeight: 'bold', color: isRealTime ? '#2e7d32' : '#666' }}>
                    {row.rkey}
                    {isRealTime && <span style={{ color: '#4caf50', marginLeft: 8 }}>🟢 LIVE</span>}
                  </td>
                  <td>{row.car_name}</td>
                  <td style={{ fontFamily: 'monospace' }}>
                    <div>📍 Lat: {parseFloat(row.Latitude).toFixed(6)}</div>
                    <div>📍 Lng: {parseFloat(row.Longitude).toFixed(6)}</div>
                  </td>
                  <td>
                    {row.Temperature ? `${row.Temperature}°C` : 'N/A'}
                  </td>
                  <td style={{ 
                    fontFamily: 'monospace', 
                    fontSize: 12,
                    backgroundColor: '#f8f8f8',
                    maxWidth: 200,
                    wordBreak: 'break-all'
                  }}>
                    {row.MQTT_TOPIC}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {row.senddt ? 
                      `${row.senddt.substring(0,2)}:${row.senddt.substring(2,4)}:${row.senddt.substring(4,6)}` 
                      : 'N/A'
                    }
                  </td>
                  <td>
                    <a 
                      href={`https://miju119.mijuit.co.kr:8080/rkey=${row.rkey}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: 4,
                        fontSize: 12
                      }}
                    >
                      🗺️ Track
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          color: '#666',
          fontSize: 18
        }}>
          {isOnline ? '⏳ Loading GPS data...' : '❌ Connection lost. Retrying...'}
        </div>
      )}

      {/* Info */}
      <div style={{ 
        marginTop: 20, 
        padding: 12, 
        backgroundColor: '#f8f9fa', 
        borderRadius: 8,
        fontSize: 14,
        color: '#666'
      }}>
        <div><strong>📡 Auto-Refresh:</strong> Data updates automatically every 3 seconds</div>
        <div><strong>🟢 Real-time:</strong> Green rows show live GPS data from MQTT</div>
      </div>
    </div>
  );
}

export default App;
