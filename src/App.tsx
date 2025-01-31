import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Blogs from "./pages/Blogs";
import BlogManagement from "./pages/BlogManagement";
import BlogPost from "./components/blogs/BlogPost";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/new" element={<BlogManagement />} />
          <Route path="/blogs/edit/:id" element={<BlogManagement />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Route>
      </Routes>
    </Router>
  );
}
