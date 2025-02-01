import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Blogs from "./pages/Blogs";
import BlogManagement from "./pages/BlogManagement";
import BlogPost from "./components/blogs/BlogPost";
import ProjectDashboard from "./pages/ProjectDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/new" element={<BlogManagement />} />
          <Route path="/blogs/edit/:id" element={<BlogManagement />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/projects/*" element={<ProjectDashboard />} />
          {/* Redirect any unknown routes to the landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}