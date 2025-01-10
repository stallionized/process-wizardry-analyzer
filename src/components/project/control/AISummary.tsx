import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ControlChart {
  variable: string;
  outOfControlPoints: number[];
  interpretation: string;
}

interface AISummaryProps {
  controlCharts: ControlChart[];
}

const AISummary = ({ controlCharts }: AISummaryProps) => {
  const totalCharts = controlCharts.length;
  const outOfControlCharts = controlCharts.filter(chart => chart.outOfControlPoints.length > 0);
  const inControlCharts = controlCharts.filter(chart => chart.outOfControlPoints.length === 0);
  
  const outOfControlReasons = outOfControlCharts.map(chart => ({
    variable: chart.variable,
    points: chart.outOfControlPoints.length,
    interpretation: chart.interpretation
  }));

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg p-6 border border-blue-200 dark:border-blue-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-300">
        <AlertCircle className="h-5 w-5" />
        AI Summary Analysis
      </h3>
      <div className="space-y-3 text-sm">
        <p>Analysis of {totalCharts} control chart{totalCharts !== 1 ? 's' : ''} shows:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>{inControlCharts.length} process{inControlCharts.length !== 1 ? 'es are' : ' is'} in statistical control</li>
          <li>{outOfControlCharts.length} process{outOfControlCharts.length !== 1 ? 'es show' : ' shows'} signs of being out of control</li>
        </ul>
        {outOfControlReasons.length > 0 && (
          <div className="mt-4">
            <p className="font-medium mb-2">Out of Control Processes Explained:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              {outOfControlReasons.map((reason, idx) => (
                <li key={idx} className="text-sm">
                  <span className="font-medium">{reason.variable}</span>: {reason.interpretation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISummary;