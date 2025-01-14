import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';

interface ExternalComplaintsProps {
  projectId: string;
}

interface Complaint {
  source_url: string;
  complaint_text: string;
  date: string;
  category: string;
}

interface CompanyInfo {
  description: string;
  variations: string[];
}

const ExternalComplaints: React.FC<ExternalComplaintsProps> = ({ projectId }) => {
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints', projectId, project?.client_name],
    queryFn: async () => {
      // First try to get complaints from database
      const { data: existingComplaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('*')
        .eq('project_id', projectId);

      if (complaintsError) throw complaintsError;

      // If we have complaints in the database, use those
      if (existingComplaints && existingComplaints.length > 0) {
        const { data: summaries } = await supabase
          .from('complaint_summaries')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        return {
          complaints: existingComplaints.map(c => ({
            source_url: c.source_url,
            complaint_text: c.complaint_text,
            date: new Date(c.created_at).toLocaleDateString(),
            category: c.theme
          })),
          companyInfo: {
            description: summaries ? `Analysis based on ${summaries.volume} complaints` : '',
            variations: []
          }
        };
      }

      // If no complaints in database, fetch new ones
      if (!project?.client_name) {
        throw new Error('Client name is required');
      }

      const response = await supabase.functions.invoke('custom-scrape-complaints', {
        body: { 
          clientName: project.client_name,
          projectId: projectId
        }
      });

      if (response.error) throw response.error;
      
      return {
        complaints: response.data.complaints.map((c: any) => ({
          source_url: c.source,
          complaint_text: c.text,
          date: new Date(c.date).toLocaleDateString(),
          category: 'Customer Review'
        })),
        companyInfo: {
          description: `Found ${response.data.complaints.length} recent complaints`,
          variations: []
        }
      };
    },
    enabled: !!projectId && !!project?.client_name,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load complaints: {error.message}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!project?.client_name) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please set a client name to analyze external complaints.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  const companyInfo = data?.companyInfo;
  const complaints = data?.complaints || [];

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
      
      {companyInfo && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Company Information</h3>
          <p className="text-muted-foreground mb-2">{companyInfo.description}</p>
          {companyInfo.variations && companyInfo.variations.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Common name variations: {companyInfo.variations.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Complaints ({complaints.length})</h3>
      </div>

      <ScrollArea className="h-[500px] rounded-md border">
        <div className="p-4 space-y-4">
          {complaints.length > 0 ? (
            complaints.map((complaint, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">{complaint.category}</span>
                  <span className="text-sm text-muted-foreground">{complaint.date}</span>
                </div>
                <p className="text-sm mb-2">{complaint.complaint_text}</p>
                <a 
                  href={complaint.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Source
                </a>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Info className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No complaints found for this company. This could mean either there are no recorded complaints or the search needs to be refined.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ExternalComplaints;
