import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export const FeaturedBlogs = () => {
  const navigate = useNavigate();
  const { data: blogs, isLoading } = useQuery({
    queryKey: ['featured-blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('featured', true)
        .eq('status', 'published')
        .is('archived_at', null)
        .not('display_order', 'is', null)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-48 bg-black/20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {blogs?.map((blog, index) => (
        <motion.div
          key={blog.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => navigate(`/blogs/${blog.slug || blog.id}`)}
          className="cursor-pointer"
        >
          <Card className="p-6 bg-black/[0.96] border-white/10 hover:border-white/20 transition-all">
            <h3 className="text-xl font-semibold text-white mb-2">{blog.title}</h3>
            <p className="text-neutral-300 text-sm">{blog.summary}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};