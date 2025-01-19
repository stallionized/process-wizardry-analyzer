import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import LogoUpload from '@/components/clients/LogoUpload';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserPlus, Trash2, Edit, Phone, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  logo_url?: string;
}

interface ClientData extends ClientFormData {
  id: string;
}

const ClientManagement = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  
  const clientForm = useForm<ClientFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      contact_person: '',
      logo_url: ''
    }
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast.error('Error fetching clients');
      console.error('Error:', error.message);
    }
  };

  const onSubmitClient = async (data: ClientFormData) => {
    try {
      // Transform empty strings to null while maintaining types
      const cleanedData: ClientFormData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
      ) as ClientFormData;

      // Ensure name is present as it's required
      if (!cleanedData.name) {
        toast.error('Client name is required');
        return;
      }

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(cleanedData)
          .eq('id', editingClient.id);

        if (error) throw error;
        toast.success('Client updated successfully');
      } else {
        const { error } = await supabase
          .from('clients')
          .insert(cleanedData);

        if (error) throw error;
        toast.success('Client created successfully');
      }

      clientForm.reset();
      setIsClientDialogOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (error: any) {
      toast.error(error.message);
      console.error('Error:', error.message);
    }
  };

  const handleEditClient = (client: ClientData) => {
    setEditingClient(client);
    clientForm.reset(client);
    setIsClientDialogOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (error: any) {
      toast.error('Error deleting client');
      console.error('Error:', error.message);
    }
  };

  const handleLogoUpload = (url: string) => {
    clientForm.setValue('logo_url', url);
  };

  return (
    <div className="space-y-8 pt-8"> {/* Added pt-8 for extra top padding */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
        <p className="text-muted-foreground">
          Create and manage client accounts
        </p>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Clients</h2>
          <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingClient(null);
                clientForm.reset({
                  name: '',
                  email: '',
                  phone: '',
                  address: '',
                  contact_person: '',
                  logo_url: ''
                });
              }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle className="text-center text-xl">
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </DialogTitle>
              </DialogHeader>
              <Form {...clientForm}>
                <form onSubmit={clientForm.handleSubmit(onSubmitClient)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="name"
                      rules={{ required: "Client name is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter client name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={clientForm.control}
                      name="contact_person"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact person's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={clientForm.control}
                      name="email"
                      rules={{
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address format"
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="client@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={clientForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={clientForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter client address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={clientForm.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Logo</FormLabel>
                          <FormControl>
                            <LogoUpload
                              currentLogo={field.value}
                              onUpload={handleLogoUpload}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">
                      {editingClient ? 'Update Client' : 'Add Client'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-4">
          {clients.map((client) => (
            <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                {client.logo_url && (
                  <img
                    src={client.logo_url}
                    alt={`${client.name} logo`}
                    className="w-12 h-12 object-contain rounded"
                  />
                )}
                <div className="space-y-1">
                  <h3 className="font-medium">{client.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </span>
                    )}
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEditClient(client)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteClient(client.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ClientManagement;