import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

function Dashboard() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const eventSourceRef = useRef(null);

  const restartConnection = () => {
    console.log('🔄 Manually restarting SSE connection...');
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setConnectionStatus('Reconnecting...');
    setIsOnline(false);
    
    // Start new connection after a short delay
    setTimeout(() => {
      setupSSEConnection();
    }, 1000);
  };

  const setupSSEConnection = () => {
    console.log('🔄 Setting up Server-Sent Events connection...');
    
    // Ensure no existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    // Create EventSource for real-time updates
    eventSourceRef.current = new EventSource('http://localhost:3001/car_pos/stream');
    
    eventSourceRef.current.onopen = () => {
      console.log('✅ SSE connection established');
      setIsOnline(true);
      setConnectionStatus('Connected (Real-time)');
    };

    eventSourceRef.current.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        console.log('📡 Received real-time data:', newData.length, 'vehicles');
        
        setData(newData);
        setLastUpdate(new Date());
        setIsOnline(true);
        setUpdateCount(prev => prev + 1);
        setConnectionStatus('Live Updates');
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      console.log('EventSource readyState:', eventSourceRef.current?.readyState);
      setIsOnline(false);
      setConnectionStatus('Connection Error');
      
      // Don't auto-reconnect, let the component handle it
    };
  };

  useEffect(() => {
    setupSSEConnection();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        console.log('🔌 Closing SSE connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []); // Empty dependency array to run only once

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
            <span>{connectionStatus}</span>
            <span style={{ color: '#666', fontSize: 12 }}>
              (SSE: {eventSourceRef.current?.readyState === 0 ? 'CONNECTING' : 
                     eventSourceRef.current?.readyState === 1 ? 'OPEN' : 
                     eventSourceRef.current?.readyState === 2 ? 'CLOSED' : 'UNKNOWN'})
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
              <th>🏃 Speed</th>
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
                  <td>
                    {row.Speed ? `${row.Speed} km/h` : 'N/A'}
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
                    <Link 
                      to={`/track/${row.rkey}`}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        display: 'inline-block'
                      }}
                    >
                      🗺️ Track
                    </Link>
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
        <div><strong>🟢 Live Updates:</strong> Data pushed instantly from server</div>
        <div><strong>🗺️ Track Link:</strong> Click "Track" to view vehicle location on map</div>
      </div>
    </div>
  );
}

export default Dashboard; 