import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import { LogOut, Menu, LogIn, User } from 'lucide-react';
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
          'w-full justify-start text-white hover:text-white hover:bg-primary/20',
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
  const { session } = useSessionContext();
  const isMobile = useIsMobile();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const Navigation = () => (
    <>
      {session ? (
        <>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-white hover:text-white hover:bg-primary/20">
                  <User className="h-4 w-4 mr-2" />
                  Admin
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-primary border-primary min-w-[8rem] p-2">
                  <div className="w-48">
                    <NavLink to="/dashboard" onClick={() => isMobile && setIsMenuVisible(false)}>Dashboard</NavLink>
                    <NavLink to="/users" onClick={() => isMobile && setIsMenuVisible(false)}>User Management</NavLink>
                    <NavLink to="/clients" onClick={() => isMobile && setIsMenuVisible(false)}>Client Management</NavLink>
                    <NavLink to="/blogs" onClick={() => isMobile && setIsMenuVisible(false)}>Blog Management</NavLink>
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
            className="ml-2 text-white hover:text-white hover:bg-primary/20"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Link to="/auth">
          <Button
            variant="ghost"
            className="text-white hover:text-white hover:bg-primary/20 gap-2"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary backdrop-blur supports-[backdrop-filter]:bg-primary/60">
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
                <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-primary/20">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[280px] bg-black border-white/10">
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