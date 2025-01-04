export interface FileData {
  id: string;
  name: string;
  url: string;
}

interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
}

interface ChartData {
  type: string;
  title: string;
  data: Array<Record<string, any>>;
  xKey: string;
  yKeys: string[];
  description?: string;
}

export interface AnalysisResults {
  correlationMatrix: Record<string, Record<string, number>>;
  mappings: Record<string, Record<string, number>>;
  descriptiveStats: Record<string, DescriptiveStats>;
  statsAnalysis: string;
  advancedAnalysis: {
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