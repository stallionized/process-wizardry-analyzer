import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import Index from '@/pages/Index';
import Admin from '@/pages/Admin';
import BlogManagement from '@/pages/BlogManagement';
import Blogs from '@/pages/Blogs';
import Client from '@/pages/Client';
import ClientManagement from '@/pages/ClientManagement';
import ProjectDashboard from '@/pages/ProjectDashboard';
import RecycleBin from '@/pages/RecycleBin';
import UserManagement from '@/pages/UserManagement';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/blogs/manage" element={<BlogManagement />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/client" element={<Client />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/project/:id" element={<ProjectDashboard />} />
          <Route path="/recycle-bin" element={<RecycleBin />} />
          <Route path="/users" element={<UserManagement />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;