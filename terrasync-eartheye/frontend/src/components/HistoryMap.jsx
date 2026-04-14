import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw } from 'lucide-react';

const HistoryMap = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    try {
      const resp = await axios.get(`${API_URL}/api/history`);
      setHistory(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getMarkerColor = (alertLevel) => {
    switch(alertLevel) {
      case 'CRITICAL': return '#ef4444';
      case 'WARNING': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Global Risk History</h3>
          <p style={{ color: 'var(--text-muted)' }}>Interactive map of all historical AI satellite analysis scans.</p>
        </div>
        <button className="toggle-btn" onClick={fetchHistory} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} className={loading ? 'loader' : ''} style={loading ? { animation: 'spin 1s linear infinite' } : {}}/>
          Refresh Data
        </button>
      </div>
      
      <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {history.map((record) => (
            <CircleMarker 
              key={record.id}
              center={[record.latitude, record.longitude]}
              radius={8}
              pathOptions={{
                color: getMarkerColor(record.alert_level),
                fillColor: getMarkerColor(record.alert_level),
                fillOpacity: 0.7
              }}
            >
              <Popup>
                <div style={{ color: '#000', minWidth: '150px' }}>
                  <strong>{record.label}</strong><br/>
                  Alert Level: {record.alert_level}<br/>
                  Confidence: {Math.round(record.confidence * 100)}%<br/>
                  Date: {new Date(record.timestamp).toLocaleDateString()}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Critical Risk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Warning</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Normal</span>
        </div>
      </div>
    </div>
  );
};

export default HistoryMap;
