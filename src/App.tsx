import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useSessionContext } from '@supabase/auth-helpers-react';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ProjectDashboard from './pages/ProjectDashboard';
import ProjectList from './components/projects/ProjectList';
import { useProjects } from './hooks/useProjects';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useSessionContext();
  
  if (!session) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children}</>;
};

const ProjectsPage = () => {
  const { projects, isLoading, updateProjectMutation, softDeleteMutation } = useProjects();

  const handleStatusChange = (projectId: string, newStatus: any) => {
    if (newStatus === 'Delete') {
      softDeleteMutation.mutate(projectId);
    } else {
      updateProjectMutation.mutate({ id: projectId, status: newStatus });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Projects</h1>
      <ProjectList
        projects={projects}
        isLoading={isLoading}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:id"
            element={
              <ProtectedRoute>
                <ProjectDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;