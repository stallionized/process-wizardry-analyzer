import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
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
import { supabase } from '@/integrations/supabase/client';
import './App.css';

function App() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <Router>
        <Routes>
          {/* Landing page without Layout wrapper */}
          <Route path="/" element={<Landing />} />
          
          {/* Auth page without Layout wrapper */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes with Layout wrapper */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/clients" element={<ClientManagement />} />
            <Route path="/blogs" element={<BlogManagement />} />
            <Route path="/client" element={<Client />} />
            <Route path="/blogs" element={<Blogs />} />
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </SessionContextProvider>
  );
}

export default App;