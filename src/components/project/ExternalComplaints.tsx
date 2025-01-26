import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, ExternalLink } from 'lucide-react';
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
  created_at: string;
  theme: string;
  trend: string;
  id: string;
  project_id: string;
}

interface ScrapingUrls {
  trustpilot_url: string | null;
  bbb_url: string | null;
  pissed_customer_url: string | null;
  google_reviews_id: string | null;
}

const ExternalComplaints: React.FC<ExternalComplaintsProps> = ({ projectId }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [urls, setUrls] = useState<ScrapingUrls>({
    trustpilot_url: null,
    bbb_url: null,
    pissed_customer_url: null,
    google_reviews_id: null
  });
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 50; // Show 50 reviews per page

  // Fetch URLs
  const { data: scrapingUrls, isLoading: isLoadingUrls } = useQuery({
    queryKey: ['scraping-urls', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scraping_urls')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching URLs:', error);
        throw error;
      }

      if (data) {
        setUrls({
          trustpilot_url: data.trustpilot_url || '',
          bbb_url: data.bbb_url || '',
          pissed_customer_url: data.pissed_customer_url || '',
          google_reviews_id: data.google_reviews_id || ''
        });
      }

      return data;
    }
  });

  // Check if there are any existing complaints
  const { data: existingComplaints } = useQuery({
    queryKey: ['existing-complaints', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      if (error) throw error;
      return data;
    }
  });

  const hasExistingComplaints = existingComplaints && existingComplaints.length > 0;

  // Fetch project details first
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      console.log('Fetching project with ID:', projectId);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

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
          trustpilot_url: urls.trustpilot_url,
          bbb_url: urls.bbb_url,
          pissed_customer_url: urls.pissed_customer_url,
          google_reviews_id: urls.google_reviews_id
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
    scrapingUrls.pissed_customer_url ||
    scrapingUrls.google_reviews_id
  );

  // Fetch complaints with pagination
  const { data: complaintsData, isLoading: isLoadingComplaints } = useQuery({
    queryKey: ['complaints', projectId, page],
    queryFn: async () => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      console.log(`Fetching complaints from ${start} to ${end}`);

      const { data, error, count } = await supabase
        .from('complaints')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        console.error('Error fetching complaints:', error);
        throw error;
      }

      console.log(`Retrieved ${data?.length} complaints, total count: ${count}`);
      
      // Remove duplicates based on complaint_text and created_at
      const uniqueComplaints = data ? data.filter((complaint, index, self) =>
        index === self.findIndex((c) => (
          c.complaint_text === complaint.complaint_text &&
          c.created_at === complaint.created_at
        ))
      ) : [];

      return {
        complaints: uniqueComplaints,
        totalCount: count || 0
      };
    },
    placeholderData: (previousData) => previousData
  });

  const totalPages = complaintsData ? Math.ceil(complaintsData.totalCount / pageSize) : 0;

  const handleRetrieve = async () => {
    try {
      setIsRefreshing(true);
      
      if (!urls.google_reviews_id) {
        toast.error('Google Reviews Identifier is required');
        return;
      }

      // First, delete existing complaints for this project
      const { error: deleteError } = await supabase
        .from('complaints')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) {
        console.error('Error deleting existing complaints:', deleteError);
        toast.error('Failed to clear existing reviews');
        return;
      }

      // Then fetch new reviews using the scraper
      const response = await supabase.functions.invoke('google-reviews-scraper', {
        body: { 
          placeId: urls.google_reviews_id,
          projectId: projectId
        }
      });

      if (response.error) {
        console.error('Error from Google Reviews scraper:', response.error);
        toast.error('Failed to retrieve reviews');
        return;
      }

      // Force refetch to get the new reviews
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['complaints', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['existing-complaints', projectId] })
      ]);

      toast.success(`Successfully retrieved ${response.data.reviewsCount} reviews`);
    } catch (error) {
      console.error('Error retrieving reviews:', error);
      toast.error('Failed to retrieve reviews');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await handleRetrieve();
  };

  if (isLoadingProject || isLoadingUrls) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-6">External Reviews Analysis</h2>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  const complaints = complaintsData?.complaints || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">External Reviews Analysis</h2>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Configure</Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Configure Scraping URLs</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="google">Google Reviews</Label>
                  </div>
                  <Input
                    id="google"
                    value={urls.google_reviews_id || ''}
                    onChange={(e) => setUrls(prev => ({ ...prev, google_reviews_id: e.target.value }))}
                    placeholder="Enter Google Reviews Identifier"
                  />
                </div>
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
          {hasConfiguredUrls && (
            hasExistingComplaints ? (
              <Button 
                variant="outline" 
                onClick={handleRetrieve}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh Reviews'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleRetrieve}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Retrieving...' : 'Retrieve Reviews'}
              </Button>
            )
          )}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">
          Complaints ({complaintsData?.totalCount || 0})
        </h3>
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
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Info className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No reviews found. Click retrieve to fetch new reviews.
              </p>
            </div>
          ) : (
            <>
              {complaints.map((complaint, index) => (
                <div key={complaint.id} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">{complaint.theme}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(complaint.created_at)}
                    </span>
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
              
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} of {totalPages} ({complaintsData?.totalCount} total reviews)
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExternalComplaints;