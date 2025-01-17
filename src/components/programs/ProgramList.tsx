import React, { useState } from 'react';
import { Program } from '@/types/program';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePrograms } from '@/hooks/usePrograms';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProgramListProps {
  clientId: string;
  onSelect?: (program: Program) => void;
  selectable?: boolean;
}

const ProgramList = ({ clientId, onSelect, selectable = false }: ProgramListProps) => {
  const { programs, isLoading, createProgramMutation, updateProgramMutation, deleteProgramMutation } = usePrograms(clientId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    program_name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProgram) {
      await updateProgramMutation.mutateAsync({
        id: editingProgram.id,
        ...formData,
      });
    } else {
      await createProgramMutation.mutateAsync({
        ...formData,
        client_id: clientId,
      });
    }

    setFormData({ program_name: '', description: '' });
    setEditingProgram(null);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      program_name: program.program_name,
      description: program.description || '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteProgramMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Programs</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProgram ? 'Edit Program' : 'Create New Program'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="program_name">Program Name</Label>
                <Input
                  id="program_name"
                  value={formData.program_name}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingProgram ? 'Update Program' : 'Create Program'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {programs.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No programs found. Create your first program to get started.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card
              key={program.id}
              className={`p-4 ${selectable ? 'cursor-pointer hover:bg-accent/50' : ''}`}
              onClick={() => selectable && onSelect?.(program)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{program.program_name}</h3>
                {!selectable && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(program);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Program</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will move the program to the recycle bin. All associated projects will remain intact but will no longer be associated with this program.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(program.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
              {program.description && (
                <p className="text-sm text-muted-foreground">{program.description}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgramList;