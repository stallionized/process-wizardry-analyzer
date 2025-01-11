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
import { Loader2 } from 'lucide-react';

interface ComplaintTheme {
  summary: string;
  volume: number;
  examples: string[];
}

interface ExternalComplaintsProps {
  projectId: string;
}

const ExternalComplaints = ({ projectId }: ExternalComplaintsProps) => {
  const { data: projectDetails } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('client_name, topics')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: complaints, isLoading, error } = useQuery({
    queryKey: ['complaints', projectId, projectDetails?.client_name, projectDetails?.topics],
    queryFn: async () => {
      if (!projectDetails?.client_name) {
        throw new Error('Company name is required');
      }

      const response = await supabase.functions.invoke('analyze-complaints', {
        body: {
          companyName: projectDetails.client_name,
          topics: projectDetails.topics,
        },
      });

      if (response.error) throw response.error;
      return response.data as ComplaintTheme[];
    },
    enabled: !!projectDetails?.client_name,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p>Analyzing complaints data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <p className="text-red-500">
          Failed to analyze complaints. Please ensure a company name is provided in the project details.
        </p>
      </Card>
    );
  }

  if (!complaints) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <p className="text-muted-foreground">
          Analysis will appear here after processing the company's complaint data.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Complaint Theme/Trend</TableHead>
              <TableHead className="w-1/4 text-right">Volume</TableHead>
              <TableHead className="w-1/4 text-right">Example Links</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((complaint, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{complaint.summary}</TableCell>
                <TableCell className="text-right">{complaint.volume}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {complaint.examples.map((example, exampleIndex) => (
                      <a
                        key={exampleIndex}
                        href={example.startsWith('http') ? example : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => {
                          if (!example.startsWith('http')) {
                            e.preventDefault();
                            toast.info(example);
                          }
                        }}
                      >
                        {exampleIndex + 1}
                      </a>
                    ))}
                  </div>
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