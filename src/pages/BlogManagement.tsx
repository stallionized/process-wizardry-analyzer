import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import RichTextEditor from "@/components/blogs/RichTextEditor";

interface BlogForm {
  title: string;
  topic: string;
  seoKeywords: string;
  content: string;
  summary: string;
  heroImage: FileList;
  featured: boolean;
}

export default function BlogManagement() {
  const { id } = useParams();
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [content, setContent] = useState("");
  const [isEditorDisabled, setIsEditorDisabled] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BlogForm>();

  const { data: blog, isLoading: isBlogLoading } = useQuery({
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
      setValue('title', blog.title);
      setValue('summary', blog.summary || '');
      setValue('featured', blog.featured || false);
      setContent(blog.content || '');
      if (blog.hero_image_url) {
        setPreviewUrl(blog.hero_image_url);
      }
    }
  }, [blog, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const generateContent = async (topic: string) => {
    if (!topic) {
      toast({
        title: "Topic required",
        description: "Please enter a topic to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsEditorDisabled(true);
    try {
      const { data: generatedContent, error: generateError } = await supabase.functions.invoke('generate-blog-content', {
        body: { 
          topic,
          seoKeywords: watch('seoKeywords')
        }
      });

      if (generateError) throw generateError;
      
      if (generatedContent.content && generatedContent.summary) {
        const aiContent = {
          originalContent: generatedContent.content,
          originalSummary: generatedContent.summary,
          generatedAt: new Date().toISOString(),
          topic,
          seoKeywords: watch('seoKeywords')
        };

        const { error: saveError } = id
          ? await supabase
              .from('blogs')
              .update({ 
                content: generatedContent.content,
                summary: generatedContent.summary,
                ai_generated_content: aiContent,
                updated_at: new Date().toISOString()
              })
              .eq('id', id)
          : await supabase
              .from('blogs')
              .insert({
                title: watch('title') || 'Untitled Blog',
                content: generatedContent.content,
                summary: generatedContent.summary,
                ai_generated_content: aiContent,
                status: 'draft',
                author_id: session?.user.id
              });

        if (saveError) throw saveError;

        setContent(generatedContent.content);
        setValue('summary', generatedContent.summary);
        
        toast({
          title: "Content generated and saved",
          description: "You can now edit the generated content.",
        });
      } else {
        throw new Error('Invalid response format from content generation');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error generating content",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsEditorDisabled(false);
    }
  };

  const onSubmit = async (data: BlogForm, status: 'draft' | 'published') => {
    if (!session?.user.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to publish blogs.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setIsEditorDisabled(true);
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

      const blogData = {
        title: data.title,
        content,
        summary: data.summary,
        hero_image_url: heroImageUrl,
        status,
        featured: data.featured,
        author_id: session.user.id,
        updated_at: new Date().toISOString(),
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
          ? "Your blog has been published and is now available."
          : "Your blog has been saved as draft.",
      });

      navigate('/blogs');
    } catch (error: any) {
      console.error('Error saving blog:', error);
      toast({
        title: "Error saving blog",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsEditorDisabled(false);
    }
  };

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
        
        <form className="space-y-6" onSubmit={handleSubmit((data) => onSubmit(data, 'published'))}>
          <div>
            <Label htmlFor="title">Blog Title</Label>
            <Input
              id="title"
              placeholder="Enter blog title"
              {...register('title', { required: true })}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">Title is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="summary">Blog Summary</Label>
            <Textarea
              id="summary"
              placeholder="Enter a brief summary of your blog post"
              {...register('summary', { required: true })}
              className="resize-y"
            />
            {errors.summary && (
              <p className="text-sm text-red-500 mt-1">Summary is required</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              {...register('featured')}
            />
            <Label htmlFor="featured">Feature this blog post</Label>
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
              <Textarea
                id="topic"
                placeholder="Enter blog topic for AI generation"
                className="min-h-[100px] resize-y"
                {...register('topic')}
              />
              <Button
                type="button"
                onClick={() => generateContent(watch('topic'))}
                disabled={isLoading}
                className="h-fit"
              >
                Generate Content
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="seoKeywords">SEO Keywords to Include</Label>
            <Textarea
              id="seoKeywords"
              placeholder="Enter SEO keywords separated by commas (optional)"
              className="resize-y"
              {...register('seoKeywords')}
            />
          </div>

          <div>
            <Label htmlFor="content">Blog Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              disabled={isEditorDisabled || isBlogLoading || isLoading}
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
              type="submit"
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
