import React, { useState } from 'react';
import axios from 'axios';
import UploadPanel from './components/UploadPanel';
import GlobalMapSelector from './components/GlobalMapSelector';
import ResultCard from './components/ResultCard';
import HeatmapViewer from './components/HeatmapViewer';
import HistoryMap from './components/HistoryMap';
import { Leaf, Map as MapIcon, Image as ImageIcon, Database } from 'lucide-react';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputMode, setInputMode] = useState('map'); // 'map', 'upload', or 'history'

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    
    // Use environment variable for API URL in production, default to localhost for dev
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'An error occurred during prediction.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = async (lat, lon) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      const response = await axios.post(`${API_URL}/predict-location`, {
        lat: lat,
        lon: lon,
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'An error occurred fetching satellite data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>TerraSync EarthEye</h1>
        <p>Global Satellite Imagery Analysis for Forests & Water Stress</p>
      </header>

      <main>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button 
            onClick={() => { setInputMode('map'); setResult(null); }}
            className={`toggle-btn ${inputMode === 'map' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            <MapIcon size={20} />
            Live System Scan
          </button>
          <button 
            onClick={() => { setInputMode('upload'); setResult(null); }}
            className={`toggle-btn ${inputMode === 'upload' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            <ImageIcon size={20} />
            Manual Upload
          </button>
          <button 
            onClick={() => { setInputMode('history'); setResult(null); }}
            className={`toggle-btn ${inputMode === 'history' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            <Database size={20} />
            Global Database
          </button>
        </div>

        {!result && !loading && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {inputMode === 'map' && <GlobalMapSelector onLocationSelect={handleLocationSelect} />}
            {inputMode === 'upload' && <UploadPanel onUpload={handleFileUpload} />}
            {inputMode === 'history' && <HistoryMap />}
          </div>
        )}

        {loading && (
          <div className="glass-panel loader-container">
            <div className="loader"></div>
            <p style={{ color: 'var(--text-muted)' }}>Extracting and analyzing satellite data... This may take a moment.</p>
          </div>
        )}

        {error && (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--critical)' }}>
            <h3 style={{ color: 'var(--critical)', marginBottom: '1rem' }}>Analysis Failed</h3>
            <p>{error}</p>
            <button className="upload-btn" onClick={() => setError(null)} style={{ marginTop: '1rem' }}>
              Clear Error
            </button>
          </div>
        )}

        {result && !loading && inputMode !== 'history' && (
          <div className="dashboard">
            <div className="glass-panel">
              <HeatmapViewer raw={result.raw_image} gradcam={result.gradcam_image} />
            </div>
            <div className="glass-panel">
              <ResultCard result={result} onReset={() => setResult(null)} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
