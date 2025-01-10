import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAuthenticated(false);
      navigate('/auth/login');
      return;
    }

    setIsAuthenticated(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    setIsAdmin(profile?.is_admin || false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link to="/" className="font-bold text-xl">ProcessAI</Link>
          <div className="ml-auto flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <NavLink to="/">Projects</NavLink>
                {isAdmin && (
                  <>
                    <NavLink to="/admin/users">User Management</NavLink>
                  </>
                )}
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="container pt-20 pb-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;