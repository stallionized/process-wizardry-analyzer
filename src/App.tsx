import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/ProjectDashboard';
import UserManagement from '@/pages/UserManagement';
import ClientManagement from '@/pages/ClientManagement';
import BlogManagement from '@/pages/BlogManagement';
import Client from '@/pages/Client';
import Blogs from '@/pages/Blogs';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/blogs" element={<BlogManagement />} />
          <Route path="/client" element={<Client />} />
          <Route path="/blogs" element={<Blogs />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;