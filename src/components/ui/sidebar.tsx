import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart,
  Boxes,
  CircleDot,
  CreditCard,
  FileText,
  Settings,
  UserPlus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  playlists: string[];
}

export function Sidebar({ className, playlists, ...props }: SidebarProps) {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      
      return data;
    }
  });

  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Overview
          </h2>
          <div className="space-y-1">
            <Link to="/">
              <Button variant="ghost" className="w-full justify-start">
                <BarChart className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Reports
              </Button>
            </Link>
            <Link to="/projects">
              <Button variant="ghost" className="w-full justify-start">
                <Boxes className="mr-2 h-4 w-4" />
                Projects
              </Button>
            </Link>
            <Link to="/billing">
              <Button variant="ghost" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Projects
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <CircleDot className="mr-2 h-4 w-4" />
              Recently Added
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <CircleDot className="mr-2 h-4 w-4" />
              In Progress
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <CircleDot className="mr-2 h-4 w-4" />
              Completed
            </Button>
          </div>
        </div>
        {profile?.is_admin && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Admin
            </h2>
            <div className="space-y-1">
              <Link to="/admin/users">
                <Button variant="ghost" className="w-full justify-start">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              </Link>
            </div>
          </div>
        )}
        <div className="py-2">
          <h2 className="relative px-7 text-lg font-semibold tracking-tight">
            Playlists
          </h2>
          <ScrollArea className="h-[300px] px-1">
            <div className="space-y-1 p-2">
              {playlists?.map((playlist, i) => (
                <Button
                  key={`${playlist}-${i}`}
                  variant="ghost"
                  className="w-full justify-start font-normal"
                >
                  <CircleDot className="mr-2 h-4 w-4" />
                  {playlist}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}