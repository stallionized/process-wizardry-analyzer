import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ExternalComplaintsProps {
  projectId: string;
}

interface Complaint {
  source_url: string;
  complaint_text: string;
  date: string;
  category: string;
}

const ExternalComplaints: React.FC<ExternalComplaintsProps> = ({ projectId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch project details first
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      console.log('Fetching project with ID:', projectId);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }
      console.log('Project data:', data);
      return data;
    },
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unavailable';
    }
  };

  // Fetch complaints with dependencies on project and currentPage
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['complaints', projectId, project?.client_name, currentPage],
    queryFn: async () => {
      console.log('Starting complaints fetch for:', {
        projectId,
        clientName: project?.client_name,
        page: currentPage
      });
      
      if (!project?.client_name) {
        console.error('Client name is missing');
        throw new Error('Client name is required');
      }

      // First try to get complaints from database
      const { data: existingComplaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('*')
        .eq('project_id', projectId);

      if (complaintsError) {
        console.error('Error fetching existing complaints:', complaintsError);
        throw complaintsError;
      }

      console.log('Existing complaints:', existingComplaints);

      // If we have complaints in the database, use those
      if (existingComplaints && existingComplaints.length > 0) {
        console.log('Using existing complaints from database:', existingComplaints.length);
        return {
          complaints: existingComplaints.map(c => ({
            source_url: c.source_url,
            complaint_text: c.complaint_text,
            date: c.created_at,
            category: c.theme
          })),
          hasMore: false
        };
      }

      console.log('No existing complaints found, fetching new ones');
      const response = await supabase.functions.invoke('custom-scrape-complaints', {
        body: { 
          clientName: project.client_name,
          projectId: projectId,
          page: currentPage
        }
      });

      if (response.error) {
        console.error('Error from scraping function:', response.error);
        throw response.error;
      }
      
      console.log('Scraping response:', response.data);
      return {
        complaints: response.data.complaints || [],
        hasMore: response.data.hasMore || false
      };
    },
    enabled: !!projectId && !!project?.client_name,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false
  });

  // Add a function to manually refetch complaints
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log('Starting manual refresh...');
      
      // Delete existing complaints for this project
      const { error: deleteError } = await supabase
        .from('complaints')
        .delete()
        .eq('project_id', projectId);
      
      if (deleteError) {
        console.error('Error deleting existing complaints:', deleteError);
        toast.error('Failed to refresh complaints');
        return;
      }

      console.log('Successfully deleted existing complaints');

      // Force refetch both queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['complaints', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      ]);

      // Explicitly call refetch after invalidation
      await refetch();
      
      toast.success('Complaints refreshed successfully');
    } catch (error) {
      console.error('Error refreshing complaints:', error);
      toast.error('Failed to refresh complaints');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoadingProject || isLoading) {
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

  const complaints = data?.complaints || [];
  const hasMore = data?.hasMore || false;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">External Complaints Analysis</h2>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing || isFetching}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Complaints'}
        </Button>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Complaints ({complaints.length})</h3>
      </div>

      <ScrollArea className="h-[500px] rounded-md border">
        <div className="p-4 space-y-4">
          {complaints.length > 0 ? (
            <>
              {complaints.map((complaint, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">{complaint.category}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(complaint.date)}</span>
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
              ))}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={isFetching}
                    variant="outline"
                  >
                    {isFetching ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
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