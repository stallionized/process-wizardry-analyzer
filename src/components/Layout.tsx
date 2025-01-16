import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to}>
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start',
          isActive && 'bg-accent/10 text-accent hover:bg-accent/20'
        )}
      >
        {children}
      </Button>
    </Link>
  );
};

const Layout = () => {
  const supabase = useSupabaseClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link to="/" className="font-bold text-xl">ProcessAI</Link>
          <div className="ml-auto flex items-center space-x-4">
            <NavLink to="/">Admin</NavLink>
            <NavLink to="/client">Client Portal</NavLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="ml-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>
      <main className="container pt-20 pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;