import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

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
  const [isMenuVisible, setIsMenuVisible] = useState(false);

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
        <div className="container flex h-24 items-center pl-14 py-3">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/2874dd12-8a6e-4615-a3a8-0007e6b68381.png" 
              alt="AI Process Engineer Logo" 
              className="h-[60px] w-auto scale-125"
            />
          </Link>
          <div className="ml-auto flex items-center space-x-4 pr-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-white dark:bg-gray-900 min-w-[8rem] p-2">
                    <div className="w-48">
                      <NavLink to="/">Dashboard</NavLink>
                      <NavLink to="/users">User Management</NavLink>
                      <NavLink to="/clients">Client Management</NavLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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
      <div className="flex">
        <main className="flex-1 transition-all duration-300 ease-in-out pt-[4.5rem] pl-14 pr-8">
          <div className="p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;