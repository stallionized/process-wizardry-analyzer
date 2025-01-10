export interface FileData {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  isNew?: boolean;
}

export interface AnalysisResults {
  correlationMatrix: Record<string, Record<string, number>>;
  mappings: Record<string, Record<string, string | number>>;
  descriptiveStats: Record<string, {
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
  }>;
  statsAnalysis: string;
  advancedAnalysis?: {
    anova: {
      results: Array<{
        variable: string;
        comparedWith: string;
        fStatistic: number;
        pValue: number;
        effectSize: number;
        significanceLevel: string;
        interpretation: string;
      }>;
      summary: string;
      charts?: Array<{
        type: string;
        data: Array<Record<string, any>>;
        xKey: string;
        yKeys: string[];
        title: string;
        description?: string;
      }>;
    };
  };
}

export type AnalysisStatus = 'pending' | 'analyzing' | 'generating_control_charts' | 'completed' | 'failed';