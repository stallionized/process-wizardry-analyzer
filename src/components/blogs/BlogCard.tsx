import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Archive, Trash2, RefreshCw, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BlogCardProps {
  blog: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    archived_at: string | null;
    slug: string;
    display_order: number | null;
  };
  onArchive: (id: string, isArchived: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onDisplayOrderChange: (id: string, value: string) => void;
}

export const BlogCard = ({ 
  blog, 
  onArchive, 
  onDelete, 
  onEdit,
  onDisplayOrderChange 
}: BlogCardProps) => {
  return (
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
      <div className="flex gap-2 items-center">
        {!blog.archived_at && (
          <div className="flex items-center gap-2 mr-4">
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
            <Select
              value={blog.display_order?.toString() || 'not-selected'}
              onValueChange={(value) => onDisplayOrderChange(blog.id, value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Display Order" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-md">
                <SelectItem value="not-selected">Not Selected</SelectItem>
                <SelectItem value="1">Position 1</SelectItem>
                <SelectItem value="2">Position 2</SelectItem>
                <SelectItem value="3">Position 3</SelectItem>
                <SelectItem value="4">Position 4</SelectItem>
                <SelectItem value="5">Position 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onArchive(blog.id, !!blog.archived_at)}
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
          onClick={() => onDelete(blog.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
        <Button
          variant="ghost"
          onClick={() => onEdit(blog.id)}
        >
          Edit
        </Button>
      </div>
    </div>
  );
};