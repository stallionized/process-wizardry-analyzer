import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    createDefaultAdminUser();
    fetchUsers();
  }, []);

  const createDefaultAdminUser = async () => {
    try {
      // First try to sign up the user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: 'ccacici@wgu.edu',
        password: '#Thisrulez2',
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (signUpError) {
        // If error is not "User already registered", show it
        if (!signUpError.message.includes('User already registered')) {
          throw signUpError;
        }
        return; // Skip if user already exists
      }

      if (user) {
        // Set admin status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', user.id);

        if (updateError) throw updateError;
        
        toast({
          title: "Success",
          description: "Default admin user created successfully"
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      navigate('/');
      return;
    }

    setIsAdmin(true);
  };

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users"
      });
      return;
    }

    setUsers(profiles || []);
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status"
      });
      return;
    }

    toast({
      title: "Success",
      description: "User status updated successfully"
    });
    fetchUsers();
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.is_admin ? 'Yes' : 'No'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button
                    onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                    variant="outline"
                  >
                    Toggle Admin
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;