import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Sidebar } from './ui/sidebar';

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
    <div className="min-h-screen bg-background flex">
      <Sidebar className="hidden lg:block border-r" />
      <div className="flex-1">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Link to="/" className="font-bold text-xl">ProcessAI</Link>
            <div className="ml-auto flex items-center space-x-4">
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
    </div>
  );
};

export default Layout;