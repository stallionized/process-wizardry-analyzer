import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserPlus, Trash2 } from 'lucide-react';

interface UserFormData {
  email: string;
  password: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const form = useForm<UserFormData>();

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      setUsers(profiles || []);
    } catch (error: any) {
      toast.error('Error fetching users');
      console.error('Error:', error.message);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) throw signUpError;

      toast.success('User created successfully');
      form.reset();
      fetchUsers();
    } catch (error: any) {
      toast.error('Error creating user');
      console.error('Error:', error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error('Error deleting user');
      console.error('Error:', error.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Create and manage user accounts
        </p>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </form>
        </Form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Existing Users</h2>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <span>{user.id}</span>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDeleteUser(user.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default UserManagement;