import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjects } from '@/hooks/useProjects';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrograms } from '@/hooks/usePrograms';

interface CreateProjectFormData {
  project_name: string;
  program_id: string;
}

interface CreateProjectDialogProps {
  clientId: string;
}

const CreateProjectDialog = ({ clientId }: CreateProjectDialogProps) => {
  const { createProjectMutation } = useProjects();
  const { programs } = usePrograms(clientId);
  const { register, handleSubmit, reset } = useForm<CreateProjectFormData>();
  const [isOpen, setIsOpen] = React.useState(false);

  const onSubmit = async (data: CreateProjectFormData) => {
    await createProjectMutation.mutateAsync({
      project_name: data.project_name,
      program_id: data.program_id,
      client_id: clientId,
    });
    setIsOpen(false);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project_name">Project Name</Label>
            <Input
              id="project_name"
              {...register('project_name', { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="program_id">Program</Label>
            <Select onValueChange={(value) => register('program_id').onChange({ target: { value } })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programs?.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.program_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Create Project
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;