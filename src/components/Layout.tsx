import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { LogOut, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const NavLink = ({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} onClick={onClick}>
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
  const isMobile = useIsMobile();
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const Navigation = () => (
    <>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
            <NavigationMenuContent className="bg-white dark:bg-gray-900 min-w-[8rem] p-2">
              <div className="w-48">
                <NavLink to="/" onClick={() => isMobile && setIsMenuVisible(false)}>Dashboard</NavLink>
                <NavLink to="/users" onClick={() => isMobile && setIsMenuVisible(false)}>User Management</NavLink>
                <NavLink to="/clients" onClick={() => isMobile && setIsMenuVisible(false)}>Client Management</NavLink>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <NavLink to="/client" onClick={() => isMobile && setIsMenuVisible(false)}>Client Portal</NavLink>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        className="ml-2"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 md:h-24 items-center px-4 md:px-8 max-w-[2000px] mx-auto">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/2874dd12-8a6e-4615-a3a8-0007e6b68381.png" 
                alt="AI Process Engineer Logo" 
                className="h-[40px] md:h-[60px] w-auto scale-125"
              />
            </Link>
          </div>
          <div className="flex-grow" />
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  <Navigation />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center space-x-4">
              <Navigation />
            </div>
          )}
        </div>
      </nav>
      <div className="flex pt-16 md:pt-24">
        <main className="flex-1 min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-6rem)] px-4 md:px-8">
          <div className="max-w-[2000px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;