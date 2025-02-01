import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Index from './pages/Index';
import Auth from './pages/Auth';
import ProjectDashboard from './pages/ProjectDashboard';
import BlogManagement from './pages/BlogManagement';
import Blogs from './pages/Blogs';
import Client from './pages/Client';
import ClientManagement from './pages/ClientManagement';
import UserManagement from './pages/UserManagement';
import RecycleBin from './pages/RecycleBin';
import Admin from './pages/Admin';
import { Toaster } from './components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProjectDashboard />} />
            <Route path="/project/:id" element={<ProjectDashboard />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blog-management" element={<BlogManagement />} />
            <Route path="/client" element={<Client />} />
            <Route path="/client-management" element={<ClientManagement />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/recycle-bin" element={<RecycleBin />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;