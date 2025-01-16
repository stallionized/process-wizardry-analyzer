import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './integrations/supabase/client';
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import ProjectDashboard from "./pages/ProjectDashboard";
import RecycleBin from "./pages/RecycleBin";
import Admin from "./pages/Admin";
import Client from "./pages/Client";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionContextProvider supabaseClient={supabase}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/project/:id" element={<ProjectDashboard />} />
              <Route path="/recycle-bin" element={<RecycleBin />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/client" element={<Client />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </SessionContextProvider>
  </QueryClientProvider>
);

export default App;