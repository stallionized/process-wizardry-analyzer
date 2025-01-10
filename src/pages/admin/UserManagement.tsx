import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserProfile {
  id: string;
  email: string;
  is_admin: boolean;
}

type ProfileResponse = {
  id: string;
  is_admin: boolean;
  auth_users: {
    email: string;
  };
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, []);

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
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        is_admin,
        auth_users (
          email
        )
      `)
      .returns<ProfileResponse[]>();
    
    if (error) {
      toast.error("Failed to fetch users");
      return;
    }

    const formattedUsers = data.map(profile => ({
      id: profile.id,
      email: profile.auth_users.email,
      is_admin: profile.is_admin
    }));

    setUsers(formattedUsers);
  };

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error('Please provide both email and password');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword
        }
      });

      if (error) {
        const errorMessage = error.message || 'Failed to create user';
        toast.error(errorMessage);
        return;
      }

      toast.success('User created successfully');
      setNewUserEmail('');
      setNewUserPassword('');
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create user';
      toast.error(errorMessage);
    }
  };

  const updateUserPassword = async () => {
    if (!editingUser || !newPassword) {
      toast.error('Please provide a new password');
      return;
    }

    const { data, error } = await supabase.functions.invoke('update-user-password', {
      body: {
        userId: editingUser.id,
        newPassword: newPassword
      }
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Password updated successfully');
    setEditingUser(null);
    setNewPassword('');
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <div className="mb-8 p-6 bg-card rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Temporary Password</Label>
            <Input
              id="password"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Temporary password"
            />
          </div>
          <Button onClick={createUser}>Create User</Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.is_admin ? 'Admin' : 'User'}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password for {user.email}</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={() => {
                          setEditingUser(user);
                          updateUserPassword();
                        }}>
                          Update Password
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagement;
