import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { AnalysisResults } from '@/types';
import { CorrelationMatrix } from './correlation/CorrelationMatrix';
import { DescriptiveStats } from './descriptive/DescriptiveStats';
import { AdvancedAnalysis } from './advanced/AdvancedAnalysis';

interface AIResultsProps {
  projectId: string;
}

const AIResults = ({ projectId }: AIResultsProps) => {
  const { data: analysisResults, isLoading, error } = useQuery({
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
      
      const results = data?.results;
      if (!results || typeof results !== 'object') {
        throw new Error('Invalid analysis results format');
      }

      const typedResults = results as unknown;
      
      const isAnalysisResults = (value: unknown): value is AnalysisResults => {
        const candidate = value as Partial<AnalysisResults>;
        return (
          typeof candidate === 'object' &&
          candidate !== null &&
          'correlationMatrix' in candidate &&
          'mappings' in candidate &&
          'descriptiveStats' in candidate &&
          'statsAnalysis' in candidate &&
          'advancedAnalysis' in candidate
        );
      };

      if (!isAnalysisResults(typedResults)) {
        throw new Error('Invalid analysis results structure');
      }

      // Transform the ANOVA results to include isSignificant property
      const transformedResults = {
        ...typedResults,
        advancedAnalysis: {
          ...typedResults.advancedAnalysis,
          anova: {
            ...typedResults.advancedAnalysis.anova,
            results: typedResults.advancedAnalysis.anova.results.map(result => ({
              ...result,
              isSignificant: parseFloat(result.pValue.toString()) < 0.05
            }))
          }
        }
      };

      return transformedResults;
    },
    refetchInterval: (data) => (!data ? 5000 : false),
  });

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Analyzing data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
        <p className="text-destructive">
          Error loading analysis results. Please try again later.
        </p>
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

  const { correlationMatrix, mappings, descriptiveStats, statsAnalysis, advancedAnalysis } = analysisResults;

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
        {advancedAnalysis && (
          <div className="space-y-4">
            <AdvancedAnalysis analysis={advancedAnalysis} />
          </div>
        )}

        {/* Variable Mappings Section */}
        {Object.keys(mappings).length > 0 && (
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