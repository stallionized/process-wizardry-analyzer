export interface ChartData {
  type: string;
  title: string;
  data: Array<Record<string, any>>;
  xKey: string;
  yKeys: string[];
  description?: string;
}

export interface AnovaResult {
  variable: string;
  comparedWith: string;
  fStatistic: number;
  pValue: number;
  effectSize: number;
  interpretation: string;
  significanceLevel: string;
}

export interface AdvancedAnalysisProps {
  analysis: {
    anova: {
      results: AnovaResult[];
      summary: string;
      charts: ChartData[];
    };
    timestamp: string;
  };
}