import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Archive, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

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

  const BlogCard = ({ blog }: { blog: any }) => (
    <Card key={blog.id} className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold mb-2">{blog.title}</h2>
          <div className="text-sm text-muted-foreground">
            <span>Status: {blog.status}</span>
            <span className="mx-2">•</span>
            <span>Created: {format(new Date(blog.created_at), 'PP')}</span>
          </div>
          {blog.status === 'published' && blog.slug && !blog.archived_at && (
            <div className="mt-2">
              <Link 
                to={`/blog/${blog.slug}`}
                className="text-primary hover:underline"
              >
                View Published Blog
              </Link>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (blog.archived_at) {
                handleArchive(blog.id, true);
              } else {
                handleArchive(blog.id, false);
              }
            }}
          >
            {blog.archived_at ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedBlogId(blog.id);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(`/blogs/edit/${blog.id}`)}
          >
            Edit
          </Button>
        </div>
      </div>
    </Card>
  );

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
              <BlogCard key={blog.id} blog={blog} />
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
              <BlogCard key={blog.id} blog={blog} />
            ))}
            {blogs?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No archived blog posts.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogList;