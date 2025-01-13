import React, { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [showDetails, setShowDetails] = useState(false);

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

      return complaints;
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

  const handleVolumeClick = (category: string) => {
    setSelectedCategory(category);
    setShowDetails(true);
  };

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
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {summary.theme}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleVolumeClick(summary.theme)}
                    className="text-primary hover:underline focus:outline-none"
                  >
                    {summary.volume}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCategory} - Detailed Complaints
              </DialogTitle>
            </DialogHeader>
            
            {isLoadingDetails ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details?.map((detail, index) => (
                    <TableRow key={index}>
                      <TableCell className="max-w-xl">{detail.complaint_text}</TableCell>
                      <TableCell>
                        <a 
                          href={detail.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Source
                        </a>
                      </TableCell>
                      <TableCell>
                        {new Date(detail.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
};

export default ExternalComplaints;