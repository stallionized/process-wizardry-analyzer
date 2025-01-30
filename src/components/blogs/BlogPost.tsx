import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function BlogPost() {
  const { slug } = useParams();

  const { data: blog, isLoading } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

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

  if (!blog) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 bg-black/[0.96] border-white/10">
          <h1 className="text-2xl font-bold text-white">Blog post not found</h1>
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
      </Card>
    </motion.div>
  );
}