import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const HeatmapViewer = ({ raw, gradcam }) => {
  const [showHeatmap, setShowHeatmap] = useState(true);

  // The base64 data should already include the data:image/png;base64, prefix if not we add it
  // But our backend sends raw base64. We need to format it.
  const rawSrc = `data:image/jpeg;base64,${raw}`;
  const heatmapSrc = `data:image/png;base64,${gradcam}`;

  return (
    <div className="heatmap-container">
      <h2 className="card-title">
        Spatial Analysis
      </h2>
      
      <div className="image-comparison">
        <img 
          src={rawSrc} 
          alt="Satellite Raw" 
        />
        <img 
          src={heatmapSrc} 
          alt="GradCAM Heatmap Overlay" 
          style={{ opacity: showHeatmap ? 1 : 0 }}
        />
      </div>

      <div className="toggle-container">
        <button 
          className={`toggle-btn ${!showHeatmap ? 'active' : ''}`}
          onClick={() => setShowHeatmap(false)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <EyeOff size={16} />
          Raw Image
        </button>
        <button 
          className={`toggle-btn ${showHeatmap ? 'active' : ''}`}
          onClick={() => setShowHeatmap(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Eye size={16} />
          GradCAM Heatmap
        </button>
      </div>
      
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
        {showHeatmap ? 'Highlighting regions contributing to the risk score' : 'Original satellite imagery'}
      </p>
    </div>
  );
};

export default HeatmapViewer;
