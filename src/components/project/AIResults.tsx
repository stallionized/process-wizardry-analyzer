import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Maximize2, X } from 'lucide-react';
import { AnalysisResults } from '@/types';
import { CorrelationMatrix } from './correlation/CorrelationMatrix';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AIResultsProps {
  projectId: string;
}

const AIResults = ({ projectId }: AIResultsProps) => {
  const [maximizedSection, setMaximizedSection] = useState<'correlation' | 'mappings' | null>(null);

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
          typeof candidate.correlationMatrix === 'object' &&
          typeof candidate.mappings === 'object'
        );
      };

      if (!isAnalysisResults(typedResults)) {
        throw new Error('Invalid analysis results structure');
      }

      return typedResults;
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

  const { correlationMatrix, mappings } = analysisResults;
  const variables = Object.keys(correlationMatrix);
  const isCorrelationMatrixEmpty = variables.length === 0;

  if (isCorrelationMatrixEmpty) {
    return (
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
        <p className="text-muted-foreground">
          No correlation data available. Please ensure your uploaded files contain numerical data for analysis.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
      
      <div className="space-y-6">
        <CorrelationMatrix correlationMatrix={correlationMatrix} />

        {Object.keys(mappings).length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Variable Mappings</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setMaximizedSection('mappings')}
              >
                <Maximize2 className="h-4 w-4" />
                Maximize
              </Button>
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

      <Dialog open={maximizedSection === 'mappings'} onOpenChange={() => setMaximizedSection(null)}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-6 animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Variable Mappings</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMaximizedSection(null)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
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
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AIResults;