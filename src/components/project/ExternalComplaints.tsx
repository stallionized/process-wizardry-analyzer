import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExternalComplaintsProps {
  projectId: string;
}

const ExternalComplaints = ({ projectId }: ExternalComplaintsProps) => {
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

      return summaries;
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

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
      
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Theme</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead>Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((summary, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{summary.theme}</TableCell>
                <TableCell>{summary.trend}</TableCell>
                <TableCell>{summary.volume}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Recent Complaints</h3>
          <div className="space-y-4">
            {summaries.flatMap(summary => 
              summary.complaints.slice(0, 3).map((complaint, idx) => (
                <div key={idx} className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{complaint}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ExternalComplaints;