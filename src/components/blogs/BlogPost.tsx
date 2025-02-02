import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

type Blog = {
  id: string;
  title: string;
  content: string;
  hero_image_url: string | null;
  created_at: string;
}

export default function BlogPost() {
  const { slug } = useParams();

  const { data: blog, isLoading, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, content, hero_image_url, created_at')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching blog:', error);
        throw error;
      }

      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 bg-white border-black">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 bg-white border-black">
          <h1 className="text-2xl font-bold text-gray-900">Error loading blog post</h1>
          <p className="text-gray-600 mt-2">There was an error loading the blog post. Please try again later.</p>
        </Card>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 bg-white border-black">
          <h1 className="text-2xl font-bold text-gray-900">Blog post not found</h1>
          <p className="text-gray-600 mt-2">
            The blog post you're looking for doesn't exist or hasn't been published yet.
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
      <Card className="p-6 bg-white border-black">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">{blog.title}</h1>
        <div className="text-sm text-gray-600 mb-6">
          Published on {new Date(blog.created_at).toLocaleDateString()}
        </div>
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
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </Card>
    </motion.div>
  );
}