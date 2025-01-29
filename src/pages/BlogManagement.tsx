import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface BlogForm {
  title: string;
  topic: string;
  content: string;
  heroImage: FileList;
}

const createSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export default function BlogManagement() {
  const { id } = useParams();
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<BlogForm>();

  const { data: blog, isLoading: isBlogLoading, error: blogError } = useQuery({
    queryKey: ['blog', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (blog) {
      reset({
        title: blog.title,
        content: blog.content,
        topic: '',
      });
      if (blog.hero_image_url) {
        setPreviewUrl(blog.hero_image_url);
      }
    }
  }, [blog, reset]);

  if (isBlogLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (blogError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Blog</h1>
          <p className="text-gray-600">Please try again later.</p>
        </Card>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const generateContent = async (topic: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { topic }
      });

      if (error) throw error;
      setValue('content', data.content);
      toast({
        title: "Content generated successfully",
        description: "You can now edit the generated content.",
      });
    } catch (error) {
      toast({
        title: "Error generating content",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: BlogForm, status: 'draft' | 'published') => {
    if (!session?.user.id) return;
    
    setIsLoading(true);
    try {
      let heroImageUrl = previewUrl;
      
      if (data.heroImage?.[0]) {
        const file = data.heroImage[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(filePath);

        heroImageUrl = publicUrl;
      }

      const slug = createSlug(data.title);
      const blogData = {
        title: data.title,
        content: data.content,
        hero_image_url: heroImageUrl,
        status,
        author_id: session.user.id,
        updated_at: new Date().toISOString(),
        slug,
      };

      const { error } = id
        ? await supabase
            .from('blogs')
            .update(blogData)
            .eq('id', id)
        : await supabase
            .from('blogs')
            .insert(blogData);

      if (error) throw error;

      toast({
        title: `Blog ${status === 'published' ? 'published' : 'saved'} successfully`,
        description: status === 'published' 
          ? `Your blog has been published and is now available at /blog/${slug}`
          : "Your blog has been saved as draft.",
      });

      navigate('/blogs');
    } catch (error) {
      toast({
        title: "Error saving blog",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{id ? 'Edit Blog Post' : 'Create New Blog Post'}</h1>
          <Button
            variant="outline"
            onClick={() => navigate('/blogs')}
          >
            Cancel
          </Button>
        </div>
        
        <form className="space-y-6">
          <div>
            <Label htmlFor="title">Blog Title</Label>
            <Input
              id="title"
              placeholder="Enter blog title"
              {...register('title', { required: true })}
            />
          </div>

          <div>
            <Label htmlFor="heroImage">Hero Image</Label>
            <Input
              id="heroImage"
              type="file"
              accept="image/*"
              {...register('heroImage')}
              onChange={handleImageChange}
              className="mb-2"
            />
            {previewUrl && (
              <div className="mt-2 relative w-full h-[200px]">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="topic">Blog Topic</Label>
            <div className="flex gap-2">
              <Input
                id="topic"
                placeholder="Enter blog topic for AI generation"
                {...register('topic')}
              />
              <Button
                type="button"
                onClick={() => generateContent(watch('topic'))}
                disabled={isLoading}
              >
                Generate Content
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Blog Content</Label>
            <Textarea
              id="content"
              rows={15}
              placeholder="Blog content will appear here after generation, or write your own"
              {...register('content', { required: true })}
              className="font-mono"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSubmit(watch(), 'draft')}
              disabled={isLoading}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={() => onSubmit(watch(), 'published')}
              disabled={isLoading}
            >
              Publish Blog
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
