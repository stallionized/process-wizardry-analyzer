import React from 'react';

export const GradientKey = () => (
  <div className="flex flex-col items-start gap-2">
    <span className="text-sm font-medium -rotate-90 whitespace-nowrap origin-left translate-y-20">
      Correlation Strength
    </span>
    <div className="flex flex-col items-center gap-1">
      <div className="h-48 w-6 rounded" style={{ 
        background: 'linear-gradient(to top, #8b0000, #ffffff, #004d00)',
        border: '1px solid #e2e8f0'
      }} />
      <div className="flex flex-col items-center text-xs font-medium gap-[11.5rem]">
        <span>1.0</span>
        <span>0.0</span>
        <span>-1.0</span>
      </div>
    </div>
  </div>
);