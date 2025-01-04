import React from 'react';
import { AnovaResultsTable } from './AnovaResultsTable';
import { ChartComponent } from './ChartComponent';
import type { AdvancedAnalysisProps } from './types';

export const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ analysis }) => {
  const { anova } = analysis;
  
  // Prepare data for the default ANOVA chart
  const defaultChartData = {
    type: 'bar',
    title: 'ANOVA Test Results',
    data: anova.results.map(result => ({
      name: result.variable,
      'F-Statistic': result.fStatistic,
      'p-value': result.pValue
    })),
    xKey: 'name',
    yKeys: ['F-Statistic', 'p-value']
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* ANOVA Results Table */}
        <AnovaResultsTable results={anova.results} />

        {/* Default ANOVA Visualization */}
        <ChartComponent chartData={defaultChartData} />

        {/* Additional Charts from Claude */}
        {anova.charts && anova.charts.length > 0 && (
          <div className="space-y-8">
            <h4 className="text-lg font-medium">Additional Statistical Visualizations</h4>
            {anova.charts.map((chartData, index) => (
              <ChartComponent key={index} chartData={chartData} />
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-2">Analysis Summary</h4>
          <p className="text-muted-foreground">{anova.summary}</p>
        </div>
      </div>
    </div>
  );
};