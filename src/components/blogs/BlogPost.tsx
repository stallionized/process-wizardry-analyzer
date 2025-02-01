import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Database } from "@/integrations/supabase/types";

type BlogWithAuthor = {
  id: string;
  title: string;
  content: string;
  hero_image_url: string | null;
  author: {
    email: string | null;
  } | null;
  status: string;
}

export default function BlogPost() {
  const { slug } = useParams();
  console.log('Current slug:', slug);

  // First query to check blog status
  const { data: blogStatus } = useQuery({
    queryKey: ['blog-status', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('blogs')
        .select('status, archived_at')
        .eq('slug', slug)
        .maybeSingle();
      
      console.log('Blog status check:', data);
      if (error) console.error('Error checking blog status:', error);
      return data;
    },
    enabled: !!slug,
  });

  const { data: blog, isLoading, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      console.log('Fetching blog with slug:', slug);
      if (!slug) {
        console.error('No slug provided');
        return null;
      }

      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          author:profiles(email)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching blog:', error);
        throw error;
      }

      console.log('Blog data received:', data);
      if (!data) {
        if (blogStatus) {
          console.log('Blog exists but may not be published. Status:', blogStatus.status);
          console.log('Archived:', blogStatus.archived_at ? 'Yes' : 'No');
        } else {
          console.log('No blog found with slug:', slug);
        }
        return null;
      }

      type BlogResponse = Database['public']['Tables']['blogs']['Row'] & {
        author: {
          email: string | null;
        } | null;
      };

      const typedData = data as BlogResponse;

      const blogWithAuthor: BlogWithAuthor = {
        id: typedData.id,
        title: typedData.title,
        content: typedData.content,
        hero_image_url: typedData.hero_image_url,
        status: typedData.status || '',
        author: typedData.author
      };

      return blogWithAuthor;
    },
    enabled: !!slug,
  });

  console.log('Component render - blog:', blog, 'isLoading:', isLoading, 'error:', error);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 bg-black/[0.96] border-white/10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-3/4"></div>
            <div className="h-64 bg-white/10 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
              <div className="h-4 bg-white/10 rounded w-4/6"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    console.error('Error in component:', error);
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 bg-black/[0.96] border-white/10">
          <h1 className="text-2xl font-bold text-white">Error loading blog post</h1>
          <p className="text-neutral-300 mt-2">There was an error loading the blog post. Please try again later.</p>
        </Card>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 bg-black/[0.96] border-white/10">
          <h1 className="text-2xl font-bold text-white">Blog post not found</h1>
          <p className="text-neutral-300 mt-2">
            {blogStatus ? 
              "This blog post is not currently published." :
              "The blog post you're looking for doesn't exist or has been removed."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 max-w-4xl"
    >
      <Card className="p-6 bg-black/[0.96] border-white/10">
        <h1 className="text-3xl font-bold mb-4 text-white">{blog.title}</h1>
        {blog.hero_image_url && (
          <div className="mb-6">
            <img
              src={blog.hero_image_url}
              alt={blog.title}
              className="w-full h-[300px] object-cover rounded-lg"
            />
          </div>
        )}
        <div 
          className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-neutral-300"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
        {blog.author?.email && (
          <div className="mt-8 pt-4 border-t border-white/10">
            <p className="text-sm text-neutral-400">Written by {blog.author.email}</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}