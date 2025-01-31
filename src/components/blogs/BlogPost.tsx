import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

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
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (!blog) {
    return <div className="container mx-auto py-8">Blog post not found</div>;
  }

  // Format the content by replacing newlines with proper HTML breaks
  const formattedContent = blog.content
    .split('\n')
    .map((paragraph: string, index: number) => {
      // Skip empty paragraphs
      if (!paragraph.trim()) return '';
      
      // Check if the paragraph is a heading
      if (paragraph.startsWith('# ')) {
        return `<h1 class="text-3xl font-bold mt-6 mb-4">${paragraph.slice(2)}</h1>`;
      }
      if (paragraph.startsWith('## ')) {
        return `<h2 class="text-2xl font-bold mt-5 mb-3">${paragraph.slice(3)}</h2>`;
      }
      
      // Regular paragraphs
      return `<p class="mb-4 leading-relaxed">${paragraph}</p>`;
    })
    .join('');

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="p-8">
        <h1 className="text-4xl font-bold mb-6">{blog.title}</h1>
        {blog.hero_image_url && (
          <div className="mb-8">
            <img
              src={blog.hero_image_url}
              alt={blog.title}
              className="w-full h-[300px] object-cover rounded-lg"
            />
          </div>
        )}
        <div 
          className="prose prose-lg max-w-none dark:prose-invert space-y-4"
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
      </Card>
    </div>
  );
}