import React from 'react';

export const GradientKey = () => (
  <div className="flex flex-col items-start gap-8 pl-4">
    <div className="text-sm font-medium leading-tight">
      <div>Correlation</div>
      <div>Strength</div>
    </div>
    <div className="flex items-start gap-2 h-full">
      <div className="h-[calc(100%-2rem)] w-6 rounded" style={{ 
        background: 'linear-gradient(to top, #8b0000, #ffffff, #004d00)',
        border: '1px solid #e2e8f0',
        minHeight: '300px'
      }} />
      <div className="flex flex-col justify-between h-[calc(100%-2rem)] text-xs font-medium py-1" style={{ minHeight: '300px' }}>
        <span>1.0</span>
        <span>0.0</span>
        <span>-1.0</span>
      </div>
    </div>
  </div>
);