import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Blogs from "@/pages/Blogs";
import BlogManagement from "@/pages/BlogManagement";
import BlogPost from "@/components/blogs/BlogPost";
import { supabase } from "@/integrations/supabase/client";

function App() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/new" element={<BlogManagement />} />
            <Route path="/blogs/edit/:id" element={<BlogManagement />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </Layout>
      </Router>
    </SessionContextProvider>
  );
}

export default App;