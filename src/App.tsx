import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Blogs from "@/pages/Blogs";
import BlogManagement from "@/pages/BlogManagement";
import BlogPost from "@/components/blogs/BlogPost";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/new" element={<BlogManagement />} />
          <Route path="/blogs/edit/:id" element={<BlogManagement />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
