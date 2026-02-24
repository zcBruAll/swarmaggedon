import React from 'react';

const LoadingSpinner = ({ size = '16px', color = 'currentColor', className = '' }) => (
  <>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
    <svg 
      viewBox="0 0 50 50" 
      className={className}
      style={{ 
        width: size, 
        height: size, 
        marginRight: '8px', 
        animation: 'spin 1s linear infinite', 
        verticalAlign: 'middle' 
      }}
    >
      <circle 
        cx="25" 
        cy="25" 
        r="20" 
        fill="none" 
        stroke={color} 
        strokeWidth="5" 
        strokeDasharray="90,150" 
        strokeLinecap="round" 
      />
    </svg>
  </>
);

export default LoadingSpinner;
