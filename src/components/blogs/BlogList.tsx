import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { BlogCard } from './BlogCard';
import { DeleteBlogDialog } from './DeleteBlogDialog';

const BlogList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  const { data: blogs, isLoading, refetch } = useQuery({
    queryKey: ['blogs', activeTab],
    queryFn: async () => {
      const query = supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab === 'active') {
        query.is('archived_at', null);
      } else {
        query.not('archived_at', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleDisplayOrderChange = async (blogId: string, value: string) => {
    const order = value === 'not-selected' ? null : parseInt(value);
    const { error } = await supabase
      .from('blogs')
      .update({ 
        display_order: order,
        featured: order !== null 
      })
      .eq('id', blogId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update blog display order",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Blog display order updated successfully",
    });
    refetch();
  };

  const handleArchive = async (blogId: string, isArchived: boolean) => {
    const { error } = await supabase
      .from('blogs')
      .update({ 
        archived_at: isArchived ? null : new Date().toISOString(),
        status: isArchived ? 'draft' : 'archived'
      })
      .eq('id', blogId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update blog status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Blog ${isArchived ? 'restored' : 'archived'} successfully`,
    });
    refetch();
  };

  const handleDelete = async () => {
    if (!selectedBlogId) return;

    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', selectedBlogId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete blog",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Blog deleted successfully",
    });
    setShowDeleteDialog(false);
    refetch();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading blogs...</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Button onClick={() => navigate('/blogs/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Blog Post
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Blogs</TabsTrigger>
          <TabsTrigger value="archived">Archived Blogs</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {blogs?.map((blog) => (
              <Card key={blog.id} className="p-6">
                <BlogCard
                  blog={blog}
                  onArchive={handleArchive}
                  onDelete={(id) => {
                    setSelectedBlogId(id);
                    setShowDeleteDialog(true);
                  }}
                  onEdit={(id) => navigate(`/blogs/edit/${id}`)}
                  onDisplayOrderChange={handleDisplayOrderChange}
                />
              </Card>
            ))}
            {blogs?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No active blog posts. Click "New Blog Post" to get started.
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="archived" className="mt-6">
          <div className="space-y-4">
            {blogs?.map((blog) => (
              <Card key={blog.id} className="p-6">
                <BlogCard
                  blog={blog}
                  onArchive={handleArchive}
                  onDelete={(id) => {
                    setSelectedBlogId(id);
                    setShowDeleteDialog(true);
                  }}
                  onEdit={(id) => navigate(`/blogs/edit/${id}`)}
                  onDisplayOrderChange={handleDisplayOrderChange}
                />
              </Card>
            ))}
            {blogs?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No archived blog posts.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <DeleteBlogDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default BlogList;