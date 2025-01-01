import React from 'react';

export const GradientKey = () => (
  <div className="flex items-center gap-4">
    <div className="text-sm font-medium leading-tight text-center">
      <div>Correlation</div>
      <div>Strength</div>
    </div>
    <div className="flex items-start gap-2">
      <div className="h-[200px] w-4 rounded" style={{ 
        background: 'linear-gradient(to top, #8b0000, #ffffff, #004d00)',
        border: '1px solid #e2e8f0',
      }} />
      <div className="flex flex-col justify-between h-[200px] text-xs font-medium py-1">
        <span>1.0</span>
        <span>0.0</span>
        <span>-1.0</span>
      </div>
    </div>
  </div>
);