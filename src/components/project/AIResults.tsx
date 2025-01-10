import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { AnalysisResults } from '@/types';
import { CorrelationMatrix } from './correlation/CorrelationMatrix';
import { DescriptiveStats } from './descriptive/DescriptiveStats';
import { AdvancedAnalysis } from './advanced/AdvancedAnalysis';
import { Json } from '@/integrations/supabase/types';

interface AIResultsProps {
  projectId: string;
}

interface AnalysisResultsData {
  id: string;
  project_id: string;
  results: Json;
  status: 'pending' | 'analyzing' | 'generating_control_charts' | 'completed' | 'failed';
  created_at: string | null;
  control_charts: Json | null;
  descriptive_stats: Json | null;
  estimated_completion_time: string | null;
  file_size_bytes: number | null;
  started_at: string | null;
}

const AIResults = ({ projectId }: AIResultsProps) => {
  const { data: analysisResults, isLoading } = useQuery<AnalysisResultsData | null>({
    queryKey: ['analysis', projectId],
    queryFn: async () => {
      console.log('Fetching analysis results for project:', projectId);
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching analysis results:', error);
        throw error;
      }
      
      if (!data) {
        console.log('No analysis results found');
        return null;
      }
      
      console.log('Analysis results found:', data);
      return data;
    },
    refetchInterval: (data) => {
      if (!data) return 5000;
      if (data.status === 'completed' || data.status === 'failed') return false;
      return 5000;
    },
  });

  const getEstimatedTime = (fileSize: number | null) => {
    if (!fileSize) return 'Calculating...';
    const baseTime = 30; // Base processing time in seconds
    const sizeInMB = fileSize / (1024 * 1024);
    const estimatedSeconds = baseTime + (sizeInMB * 2); // 2 seconds per MB
    if (estimatedSeconds < 60) {
      return `${Math.ceil(estimatedSeconds)} seconds`;
    }
    return `${Math.ceil(estimatedSeconds / 60)} minutes`;
  };

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing analysis...</p>
        </div>
      </Card>
    );
  }

  if (!analysisResults) {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
        <p className="text-muted-foreground">
          Analysis results will appear here after processing your uploaded files.
        </p>
      </Card>
    );
  }

  if (analysisResults.status === 'failed') {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
        <p className="text-destructive">
          Analysis failed. Please try uploading your files again.
        </p>
      </Card>
    );
  }

  if (analysisResults.status !== 'completed') {
    return (
      <Card className="p-6 flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="space-y-2">
            <p className="font-medium">
              {analysisResults.status === 'analyzing' ? 'Processing dataset...' : 'Generating control charts...'}
            </p>
            <p className="text-sm text-muted-foreground">
              Estimated time remaining: {getEstimatedTime(analysisResults.file_size_bytes)}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Only try to parse results if they exist and are not empty
  if (!analysisResults.results || typeof analysisResults.results !== 'object') {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
        <p className="text-muted-foreground">
          Analysis in progress. Results will appear here once processing is complete.
        </p>
      </Card>
    );
  }

  const results = analysisResults.results as unknown as AnalysisResults;
  const { correlationMatrix, mappings, descriptiveStats, statsAnalysis, advancedAnalysis } = results;

  // Add timestamp and ensure charts array exists for advancedAnalysis
  const processedAdvancedAnalysis = advancedAnalysis ? {
    ...advancedAnalysis,
    timestamp: new Date().toISOString(),
    anova: {
      ...advancedAnalysis.anova,
      charts: advancedAnalysis.anova.charts || []
    }
  } : undefined;

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
      
      <div className="space-y-8">
        {/* Descriptive Statistics Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Descriptive Statistics</h3>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">AI Analysis Summary</h4>
            <p className="text-sm text-muted-foreground">{statsAnalysis}</p>
          </div>
          <DescriptiveStats stats={descriptiveStats} />
        </div>

        {/* Correlation Matrix Section */}
        <div className="space-y-4">
          <CorrelationMatrix correlationMatrix={correlationMatrix} />
        </div>

        {/* Advanced Analysis Section (Claude) */}
        {processedAdvancedAnalysis && (
          <div className="space-y-4">
            <AdvancedAnalysis analysis={processedAdvancedAnalysis} />
          </div>
        )}

        {/* Variable Mappings Section */}
        {mappings && Object.keys(mappings).length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Variable Mappings</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(mappings).map(([column, mapping]) => (
                <div key={column} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <h4 className="font-medium mb-2">{column}</h4>
                  <div className="space-y-1">
                    {Object.entries(mapping).map(([text, value]) => (
                      <div key={text} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{text}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIResults;