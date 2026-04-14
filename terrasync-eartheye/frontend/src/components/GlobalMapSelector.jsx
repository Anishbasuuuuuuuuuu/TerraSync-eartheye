import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix for default Leaflet marker icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationClickMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const GlobalMapSelector = ({ onLocationSelect }) => {
  const [position, setPosition] = useState(null);

  const handleSubmit = () => {
    if (position) {
      onLocationSelect(position.lat, position.lng);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <MapPin className="upload-icon" style={{ margin: 0 }} size={24} />
        <h3 style={{ fontSize: '1.25rem' }}>Interactive Satellite Fetch</h3>
      </div>
      <p style={{ color: 'var(--text-muted)' }}>
        Click anywhere on the map to drop a pin. We'll automatically retrieve live satellite imagery for that 1 sq km coordinate.
      </p>
      
      <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationClickMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div>
          {position ? (
            <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
              Selected: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No location selected</span>
          )}
        </div>
        <button 
          className="upload-btn" 
          onClick={handleSubmit}
          disabled={!position}
          style={{ margin: 0, opacity: position ? 1 : 0.5, cursor: position ? 'pointer' : 'not-allowed' }}
        >
          Scan Coordinates
        </button>
      </div>
    </div>
  );
};

export default GlobalMapSelector;
