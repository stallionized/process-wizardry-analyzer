import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface ExternalComplaintsProps {
  projectId: string;
}

interface ComplaintDetail {
  complaint_text: string;
  source_url: string;
  created_at: string;
}

const ExternalComplaints = ({ projectId }: ExternalComplaintsProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: summaries, isLoading } = useQuery({
    queryKey: ['complaint-summaries', projectId],
    queryFn: async () => {
      const { data: summaries, error } = await supabase
        .from('complaint_summaries')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching complaint summaries:', error);
        throw error;
      }

      return summaries || [];
    },
  });

  const { data: details, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['complaint-details', projectId, selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return null;

      const { data: complaints, error } = await supabase
        .from('complaints')
        .select('complaint_text, source_url, created_at')
        .eq('project_id', projectId)
        .eq('theme', selectedCategory)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching complaint details:', error);
        throw error;
      }

      return complaints || [];
    },
    enabled: !!selectedCategory,
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

  if (!summaries || summaries.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <p className="text-muted-foreground">
          No complaints analysis available yet. Update project details to trigger analysis.
        </p>
      </Card>
    );
  }

  if (selectedCategory) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Summary
          </Button>
          <h2 className="text-2xl font-semibold">{selectedCategory} Complaints</h2>
        </div>

        {isLoadingDetails ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Verbatim Complaints</h3>
              <div className="space-y-4">
                {details?.map((detail, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">
                      {detail.complaint_text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(detail.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sources</h3>
              <div className="space-y-4">
                {details?.map((detail, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <a
                      href={detail.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm block"
                    >
                      {detail.source_url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
      
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Theme/Trends</TableHead>
              <TableHead className="text-right">Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((summary, index) => (
              <TableRow key={index} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  {summary.theme}
                </TableCell>
                <TableCell 
                  className="text-right text-primary hover:underline"
                  onClick={() => setSelectedCategory(summary.theme)}
                >
                  {summary.volume}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default ExternalComplaints;