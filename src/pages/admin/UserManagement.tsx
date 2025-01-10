import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface User {
  id: string;
  email: string;
  created_at: string;
  is_admin?: boolean;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    createDefaultAdminUser();
    fetchUsers();
  }, []);

  const createDefaultAdminUser = async () => {
    try {
      // Create the user
      const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: 'ccacici@wgu.edu',
        password: '#Thisrulez2',
        email_confirm: true
      });

      if (createError) throw createError;

      if (user) {
        // Set admin status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', user.id);

        if (updateError) throw updateError;
        
        toast.success('Default admin user created successfully');
      }
    } catch (error: any) {
      // Ignore error if user already exists
      if (!error.message.includes('User already registered')) {
        toast.error(error.message);
      }
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
      toast.error('Unauthorized access');
      return;
    }

    setIsAdmin(true);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, is_admin');

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    if (authUsers?.users && profiles) {
      const combinedUsers = authUsers.users.map(user => ({
        ...user,
        is_admin: profiles.find(p => p.id === user.id)?.is_admin || false
      }));
      setUsers(combinedUsers);
    }
  };

  const handleCreateUser = async () => {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true
      });

      if (error) throw error;

      toast.success('User created successfully');
      fetchUsers();
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User status updated');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-6">Add New User</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with admin privileges.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewUserEmail('');
              setNewUserPassword('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
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
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_admin ? 'Admin' : 'User'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button
                    variant="outline"
                    onClick={() => toggleAdminStatus(user.id, user.is_admin || false)}
                  >
                    {user.is_admin ? 'Remove Admin' : 'Make Admin'}
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
