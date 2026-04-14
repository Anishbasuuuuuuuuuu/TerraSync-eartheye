import React, { useEffect, useState } from 'react';

const MetricsBar = ({ label, value, color }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Delay setting the width to trigger the CSS transition
    const timeout = setTimeout(() => {
      setWidth(value * 100);
    }, 100);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className="metric-container">
      <div className="metric-header">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="bar-bg">
        <div 
          className="bar-fill" 
          style={{ 
            width: `${width}%`, 
            background: color,
            boxShadow: `0 0 10px ${color}` // Add subtle glow
          }} 
        />
      </div>
    </div>
  );
};

export default MetricsBar;
