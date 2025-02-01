import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BlogList from '@/components/blogs/BlogList';
import BlogPost from '@/components/blogs/BlogPost';

export default function Blogs() {
  return (
    <Routes>
      <Route index element={<BlogList />} />
      <Route path=":slug" element={<BlogPost />} />
    </Routes>
  );
}