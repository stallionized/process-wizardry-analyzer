import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Index from './pages/Index';
import Auth from './pages/Auth';
import AdminUsers from './pages/AdminUsers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
