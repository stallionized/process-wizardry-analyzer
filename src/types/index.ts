export interface FileData {
  id: string;
  name: string;
  url: string;
}

export interface AnalysisResults {
  correlationMatrix: Record<string, Record<string, number>>;
  mappings: Record<string, Record<string, number>>;
}