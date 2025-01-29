import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const BlogList = () => {
  const navigate = useNavigate();

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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

      <div className="space-y-4">
        {blogs?.map((blog) => (
          <Card key={blog.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">{blog.title}</h2>
                <div className="text-sm text-muted-foreground">
                  <span>Status: {blog.status}</span>
                  <span className="mx-2">•</span>
                  <span>Created: {format(new Date(blog.created_at), 'PP')}</span>
                </div>
                {blog.status === 'published' && blog.slug && (
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
              <Button
                variant="ghost"
                onClick={() => navigate(`/blogs/edit/${blog.id}`)}
              >
                Edit
              </Button>
            </div>
          </Card>
        ))}

        {blogs?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No blog posts yet. Click "New Blog Post" to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;