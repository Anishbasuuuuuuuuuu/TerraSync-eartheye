import React from 'react';
import MetricsBar from './MetricsBar';
import { AlertTriangle, Info, CheckCircle, RotateCcw } from 'lucide-react';

const ResultCard = ({ result, onReset }) => {
  const isCritical = result.alert_level === 'CRITICAL';
  const isWarning = result.alert_level === 'WARNING';
  
  const getStatusIcon = () => {
    if (isCritical) return <AlertTriangle size={20} />;
    if (isWarning) return <Info size={20} />;
    return <CheckCircle size={20} />;
  };

  const getStatusClass = () => {
    if (isCritical) return 'status-critical';
    if (isWarning) return 'status-warning';
    return 'status-normal';
  };

  return (
    <div className="result-card">
      <div>
        <h2 className="card-title">Analysis Results</h2>
        <div className={`status-badge ${getStatusClass()}`}>
          {getStatusIcon()}
          {result.label} ({Math.round(result.confidence * 100)}%)
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <MetricsBar 
          label="Deforestation Risk" 
          value={result.deforestation_score} 
          color={result.deforestation_score > 0.5 ? 'var(--critical)' : 'var(--safe)'} 
        />
        <MetricsBar 
          label="Water Stress Level" 
          value={result.water_stress_score} 
          color={result.water_stress_score > 0.5 ? 'var(--warning)' : 'var(--accent-primary)'} 
        />
      </div>

      {result.area_affected_ha > 0 && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Estimated Area Affected</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{result.area_affected_ha.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>hectares</span></p>
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        <button 
          onClick={onReset}
          className="upload-btn" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--glass-border)' }}
        >
          <RotateCcw size={18} />
          Analyze New Image
        </button>
      </div>
    </div>
  );
};

export default ResultCard;
