import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BlogList from '@/components/blogs/BlogList';
import BlogPost from '@/components/blogs/BlogPost';

export default function Blogs() {
  return (
    <Routes>
      <Route index element={<BlogList />} />
      {/* Add both /blog/:slug and /blogs/:slug to support both URL patterns */}
      <Route path=":slug" element={<BlogPost />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
    </Routes>
  );
}