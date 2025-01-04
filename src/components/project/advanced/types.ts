export interface ChartData {
  type: string;
  title: string;
  data: Array<Record<string, any>>;
  xKey: string;
  yKeys: string[];
  description?: string;
}

export interface AdvancedAnalysisProps {
  analysis: {
    anova: {
      results: Array<{
        variable: string;
        fStatistic: number;
        pValue: number;
        interpretation: string;
      }>;
      summary: string;
      charts: ChartData[];
    };
    timestamp: string;
  };
}