import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Landing from "@/pages/Landing";
import Client from "@/pages/Client";
import Admin from "@/pages/Admin";
import ProjectDashboard from "@/pages/ProjectDashboard";
import ClientManagement from "@/pages/ClientManagement";
import UserManagement from "@/pages/UserManagement";
import RecycleBin from "@/pages/RecycleBin";
import BlogManagement from "@/pages/BlogManagement";
import Blogs from "@/pages/Blogs";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Index />} />
          <Route path="/client" element={<Client />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/project/:id" element={<ProjectDashboard />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/recycle-bin" element={<RecycleBin />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/new" element={<BlogManagement />} />
          <Route path="/blogs/edit/:id" element={<BlogManagement />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;