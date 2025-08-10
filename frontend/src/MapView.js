import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function MapView() {
  const { rkey } = useParams();
  const navigate = useNavigate();
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/car_pos');
        const vehicle = response.data.find(v => v.rkey === rkey);
        
        if (vehicle) {
          setVehicleData(vehicle);
        } else {
          setError(`Vehicle with ID "${rkey}" not found`);
        }
      } catch (err) {
        setError('Failed to fetch vehicle data');
        console.error('Error fetching vehicle data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
    
    const interval = setInterval(fetchVehicleData, 10000);
    
    return () => clearInterval(interval);
  }, [rkey]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{ fontSize: 18 }}>⏳ Loading...</div>
        <div style={{ fontSize: 14, color: '#666' }}>Vehicle: {rkey}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{ fontSize: 18, color: '#f44336' }}>❌ {error}</div>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${vehicleData.Latitude},${vehicleData.Longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 30,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 8
      }}>
        <h2 style={{ margin: 0 }}>🗺️ {vehicleData.car_name}</h2>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 20,
        marginBottom: 20
      }}>
        <div style={{ marginBottom: 15 }}>
          <strong>🆔 Vehicle ID:</strong> {vehicleData.rkey}
        </div>
        <div style={{ marginBottom: 15 }}>
          <strong>📍 Location:</strong> {parseFloat(vehicleData.Latitude).toFixed(4)}, {parseFloat(vehicleData.Longitude).toFixed(4)}
        </div>
        {vehicleData.Temperature && (
          <div style={{ marginBottom: 15 }}>
            <strong>🌡️ Temperature:</strong> {vehicleData.Temperature}°C
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <strong>⏰ Last Update:</strong> {vehicleData.senddt ? 
            `${vehicleData.senddt.substring(0,2)}:${vehicleData.senddt.substring(2,4)}:${vehicleData.senddt.substring(4,6)}` 
            : 'N/A'
          }
        </div>

        {/* Simple Google Maps Button */}
        <button
          onClick={openGoogleMaps}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 16,
            width: '100%'
          }}
        >
          🗺️ View on Google Maps
        </button>
      </div>

      <div style={{
        textAlign: 'center',
        fontSize: 12,
        color: '#666'
      }}>
        🔄 Updates every 10 seconds
      </div>
    </div>
  );
}

export default MapView; 