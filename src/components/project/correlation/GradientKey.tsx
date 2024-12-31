import React from 'react';

export const GradientKey = () => (
  <div className="flex flex-col items-start gap-2 mt-6 ml-32">
    <span className="text-sm font-medium">Correlation Strength</span>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="h-6 w-48 rounded" style={{ 
          background: 'linear-gradient(to right, #8b0000, #ffffff, #004d00)',
          border: '1px solid #e2e8f0'
        }} />
        <div className="flex justify-between w-48 text-xs font-medium">
          <span>-1.0</span>
          <span>0.0</span>
          <span>1.0</span>
        </div>
      </div>
    </div>
  </div>
);