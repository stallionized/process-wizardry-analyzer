import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface ExternalComplaintsProps {
  projectId: string;
}

interface ComplaintSummary {
  classification: string;
  volume: number;
  sources: string[];
  complaints: string[];
}

const ExternalComplaints = ({ projectId }: ExternalComplaintsProps) => {
  const [selectedSummary, setSelectedSummary] = useState<ComplaintSummary | null>(null);

  const { data: summaries, isLoading, error } = useQuery({
    queryKey: ['complaints', projectId],
    queryFn: async () => {
      const { data: complaints, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching complaints:', error);
        throw error;
      }

      // Group complaints by theme/trend combination
      const groupedComplaints = complaints.reduce((acc: { [key: string]: ComplaintSummary }, complaint) => {
        const classification = `${complaint.theme} - ${complaint.trend}`;
        
        if (!acc[classification]) {
          acc[classification] = {
            classification,
            volume: 0,
            sources: [],
            complaints: []
          };
        }
        
        acc[classification].volume += 1;
        if (!acc[classification].sources.includes(complaint.source_url)) {
          acc[classification].sources.push(complaint.source_url);
        }
        acc[classification].complaints.push(complaint.complaint_text);
        
        return acc;
      }, {});

      return Object.values(groupedComplaints);
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <p className="text-red-500">
          Failed to load complaints analysis. Please try again later.
        </p>
      </Card>
    );
  }

  if (!summaries || summaries.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <p className="text-muted-foreground">
          No results found for this client. Try updating the client name or topics to analyze different data.
        </p>
      </Card>
    );
  }

  if (selectedSummary) {
    return (
      <Card className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSummary(null)}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Summary
          </Button>
          <h2 className="text-2xl font-semibold">
            {selectedSummary.classification}
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Complaints</h3>
            <div className="space-y-4">
              {selectedSummary.complaints.map((complaint, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">{complaint}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Sources</h3>
            <div className="space-y-2">
              {selectedSummary.sources.map((source, index) => (
                <div key={index} className="p-2 bg-muted rounded">
                  <p className="text-sm">{source}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Theme/Trend</th>
              <th className="text-right py-2">Volume</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{summary.classification}</td>
                <td className="py-2 text-right">
                  <Button
                    variant="link"
                    onClick={() => setSelectedSummary(summary)}
                  >
                    {summary.volume}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ExternalComplaints;