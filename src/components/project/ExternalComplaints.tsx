import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExternalComplaintsProps {
  projectId: string;
}

interface Complaint {
  source_url: string;
  complaint_text: string;
  date: string;
  category: string;
}

interface ScrapingUrls {
  trustpilot_url: string | null;
  bbb_url: string | null;
  pissed_customer_url: string | null;
}

const ExternalComplaints: React.FC<ExternalComplaintsProps> = ({ projectId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [urls, setUrls] = useState<ScrapingUrls>({
    trustpilot_url: '',
    bbb_url: '',
    pissed_customer_url: ''
  });
  const queryClient = useQueryClient();

  // Fetch URLs
  const { data: scrapingUrls } = useQuery({
    queryKey: ['scraping-urls', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scraping_urls')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();  // Changed from .single() to .maybeSingle()

      if (error) {
        console.error('Error fetching URLs:', error);
        throw error;
      }

      if (data) {
        setUrls({
          trustpilot_url: data.trustpilot_url || '',
          bbb_url: data.bbb_url || '',
          pissed_customer_url: data.pissed_customer_url || ''
        });
      }

      return data;
    }
  });

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

  const handleUrlSubmit = async () => {
    try {
      const { error } = await supabase
        .from('scraping_urls')
        .upsert({
          project_id: projectId,
          ...urls
        }, {
          onConflict: 'project_id'
        });

      if (error) throw error;

      toast.success('URLs saved successfully');
      queryClient.invalidateQueries({ queryKey: ['scraping-urls', projectId] });
    } catch (error) {
      console.error('Error saving URLs:', error);
      toast.error('Failed to save URLs');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unavailable';
    }
  };

  // Check if any URLs are configured
  const hasConfiguredUrls = scrapingUrls && (
    scrapingUrls.trustpilot_url || 
    scrapingUrls.bbb_url || 
    scrapingUrls.pissed_customer_url
  );

  // Only fetch complaints if URLs are configured
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['complaints', projectId, project?.client_name, currentPage],
    queryFn: async () => {
      if (!project?.client_name) {
        throw new Error('Client name is required');
      }

      // First try to get complaints from database
      const { data: existingComplaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('*')
        .eq('project_id', projectId);

      if (complaintsError) {
        throw complaintsError;
      }

      // If we have complaints in the database, use those
      if (existingComplaints && existingComplaints.length > 0) {
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

      const response = await supabase.functions.invoke('openai-scrape-complaints', {
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
      
      return {
        complaints: response.data.complaints || [],
        hasMore: response.data.hasMore || false
      };
    },
    enabled: !!projectId && !!project?.client_name && !!hasConfiguredUrls,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false
  });

  // Add a function to manually refetch complaints
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
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

  if (isLoadingProject) {
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

  const complaints = data?.complaints || [];
  const hasMore = data?.hasMore || false;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">External Complaints Analysis</h2>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Configure URLs</Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Configure Scraping URLs</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="trustpilot">Trustpilot</Label>
                    <a 
                      href="https://www.trustpilot.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <Input
                    id="trustpilot"
                    value={urls.trustpilot_url || ''}
                    onChange={(e) => setUrls(prev => ({ ...prev, trustpilot_url: e.target.value }))}
                    placeholder="Enter Trustpilot URL"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="bbb">Better Business Bureau</Label>
                    <a 
                      href="https://www.bbb.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <Input
                    id="bbb"
                    value={urls.bbb_url || ''}
                    onChange={(e) => setUrls(prev => ({ ...prev, bbb_url: e.target.value }))}
                    placeholder="Enter BBB URL"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pissed">Pissed Consumer</Label>
                    <a 
                      href="https://www.pissedconsumer.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <Input
                    id="pissed"
                    value={urls.pissed_customer_url || ''}
                    onChange={(e) => setUrls(prev => ({ ...prev, pissed_customer_url: e.target.value }))}
                    placeholder="Enter Pissed Consumer URL"
                  />
                </div>
                <Button onClick={handleUrlSubmit} className="w-full">
                  Save URLs
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching || !hasConfiguredUrls}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Complaints'}
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Complaints ({complaints.length})</h3>
      </div>

      <ScrollArea className="h-[500px] rounded-md border">
        <div className="p-4 space-y-4">
          {!hasConfiguredUrls ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Info className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Configure URLs for complaint sources to start fetching complaints.
              </p>
            </div>
          ) : complaints.length > 0 ? (
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
                No complaints found. Click refresh to fetch new complaints.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ExternalComplaints;