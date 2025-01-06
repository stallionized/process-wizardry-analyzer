import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnovaResultsTable } from './AnovaResultsTable';
import { ChartComponent } from './ChartComponent';
import { PostHocResultsTable } from './PostHocResultsTable';
import type { AdvancedAnalysisProps, AnovaResult } from './types';

export const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ analysis }) => {
  const { anova } = analysis;
  const significantResults = anova.results.filter(result => result.isSignificant);
  const nonSignificantResults = anova.results.filter(result => !result.isSignificant);
  
  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">ANOVA Analysis Summary</h4>
        <p className="text-sm text-muted-foreground">{anova.summary}</p>
      </div>

      {/* Non-Significant Results Section */}
      {nonSignificantResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Non-Significant ANOVA Results</h4>
          <ScrollArea className="h-[300px] rounded-md border">
            <AnovaResultsTable results={nonSignificantResults} />
          </ScrollArea>
        </div>
      )}

      {/* Significant Results Section */}
      {significantResults.length > 0 && (
        <div className="space-y-8">
          <h4 className="text-lg font-medium">Significant ANOVA Results</h4>
          {significantResults.map((result, index) => (
            <div key={index} className="space-y-6 p-6 border rounded-lg">
              <h5 className="text-base font-medium">
                Analysis for {result.variable} vs {result.comparedWith}
              </h5>
              
              {/* ANOVA Result Summary */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">F-Statistic</p>
                  <p>{result.fStatistic.toFixed(4)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">p-Value</p>
                  <p>{result.pValue.toFixed(4)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Effect Size</p>
                  <p>{result.effectSize.toFixed(4)}</p>
                </div>
              </div>

              {/* Interpretation */}
              <div className="text-sm text-muted-foreground">
                <p>{result.interpretation}</p>
              </div>

              {/* Visualizations */}
              {result.visualizations?.map((chartData, chartIndex) => (
                <ChartComponent key={chartIndex} chartData={chartData} />
              ))}

              {/* Post Hoc Results */}
              {result.postHocResults && result.postHocResults.length > 0 && (
                <div className="space-y-4">
                  <h6 className="text-base font-medium">Post Hoc Analysis</h6>
                  <PostHocResultsTable results={result.postHocResults} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};