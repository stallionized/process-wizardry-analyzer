import React, { useState, useEffect } from 'react';
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
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComplaintDetail {
  text: string;
  source: string;
  url: string;
}

interface ComplaintTheme {
  summary: string;
  volume: number;
  complaints: ComplaintDetail[];
}

interface ExternalComplaintsProps {
  projectId: string;
}

const ExternalComplaints = ({ projectId }: ExternalComplaintsProps) => {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const { data: projectDetails, isLoading: isLoadingProject } = useQuery({
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
      
      // Validate and ensure we have all complaints
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        return null;
      }

      // Ensure each theme has the correct number of complaints matching its volume
      const validatedComplaints = response.data.map((theme: ComplaintTheme) => ({
        ...theme,
        complaints: theme.complaints || [], // Ensure complaints array exists
      }));

      return validatedComplaints as ComplaintTheme[];
    },
    enabled: !!projectDetails?.client_name,
    retry: false,
  });

  useEffect(() => {
    if (error) {
      console.error('Complaints analysis error:', error);
      toast.error('Failed to analyze complaints. Please try again later.');
    }
  }, [error]);

  if (isLoadingProject) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p>Loading project details...</p>
        </div>
      </Card>
    );
  }

  if (!projectDetails?.client_name) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <p className="text-muted-foreground">
          Please provide a company name in the project details to analyze external complaints.
        </p>
      </Card>
    );
  }

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

  if (!complaints || complaints.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <p className="text-muted-foreground">
          No complaints data found for {projectDetails.client_name}. 
          This could mean either the company has no significant online complaints or the company name needs to be verified.
        </p>
      </Card>
    );
  }

  const selectedComplaint = complaints.find(c => c.summary === selectedTheme);

  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">External Complaints Analysis</h2>
        {selectedTheme && (
          <Button
            variant="ghost"
            onClick={() => setSelectedTheme(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Summary
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        {!selectedTheme ? (
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
                  <TableCell 
                    className="text-right cursor-pointer hover:text-primary hover:underline"
                    onClick={() => {
                      if (complaint.complaints?.length !== complaint.volume) {
                        console.warn(`Volume mismatch for theme "${complaint.summary}": 
                          Expected ${complaint.volume} complaints but got ${complaint.complaints?.length}`);
                      }
                      setSelectedTheme(complaint.summary);
                    }}
                  >
                    {complaint.volume}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {complaint.complaints.slice(0, 3).map((example, exampleIndex) => (
                        <a
                          key={exampleIndex}
                          href={example.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          onClick={(e) => {
                            if (!example.url) {
                              e.preventDefault();
                              toast.info(example.text);
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
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/3">Complaint</TableHead>
                <TableHead className="w-1/3">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedComplaint?.complaints.map((complaint, index) => (
                <TableRow key={index}>
                  <TableCell>{complaint.text}</TableCell>
                  <TableCell>
                    {complaint.url ? (
                      <a
                        href={complaint.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {complaint.source}
                      </a>
                    ) : (
                      complaint.source
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
};

export default ExternalComplaints;