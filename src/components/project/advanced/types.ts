export interface ChartData {
  type: string;
  title: string;
  data: Array<Record<string, any>>;
  xKey: string;
  yKeys: string[];
  description?: string;
}

export interface PostHocResult {
  group1: string;
  group2: string;
  meanDifference: number;
  pValue: number;
  significant: boolean;
  interpretation: string;
}

export interface AnovaResult {
  variable: string;
  comparedWith: string;
  fStatistic: number;
  pValue: number;
  effectSize: number;
  interpretation: string;
  significanceLevel: string;
  isSignificant: boolean;
  postHocResults?: PostHocResult[];
  visualizations?: ChartData[];
}

export interface AdvancedAnalysisProps {
  analysis: {
    anova: {
      results: AnovaResult[];
      summary: string;
      charts: ChartData[];
      nonSignificantResults?: AnovaResult[];
    };
    timestamp: string;
  };
}