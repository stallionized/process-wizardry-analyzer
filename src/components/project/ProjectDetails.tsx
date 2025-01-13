import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';

interface ProjectDetailsProps {
  projectName: string;
  setProjectName: (value: string) => void;
  clientName: string;
  setClientName: (value: string) => void;
  deadline: Date | undefined;
  setDeadline: (date: Date | undefined) => void;
  topics?: string;
  setTopics?: (value: string) => void;
}

const ProjectDetails = ({
  projectName,
  setProjectName,
  clientName,
  setClientName,
  deadline,
  setDeadline,
  topics = '',
  setTopics = () => {}
}: ProjectDetailsProps) => {
  const queryClient = useQueryClient();
  const [initialValues] = useState({
    projectName,
    clientName,
    deadline,
    dateInput: deadline ? format(deadline, 'yyyy-MM-dd') : '',
    topics
  });

  const [dateInput, setDateInput] = useState(deadline ? format(deadline, 'yyyy-MM-dd') : '');
  const [tempProjectName, setTempProjectName] = useState(projectName);
  const [tempClientName, setTempClientName] = useState(clientName);
  const [tempTopics, setTempTopics] = useState(topics);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInput(value);
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      setDeadline(date);
    }
  };

  const handleSave = () => {
    setProjectName(tempProjectName);
    
    // If client name has changed, update it and invalidate the complaints query
    if (tempClientName !== clientName) {
      setClientName(tempClientName);
      // Invalidate both the complaints query and any existing complaints
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    }
    
    setTopics(tempTopics);
    toast.success('Project details saved successfully');
  };

  const handleCancel = () => {
    setTempProjectName(initialValues.projectName);
    setTempClientName(initialValues.clientName);
    setTempTopics(initialValues.topics);
    setDateInput(initialValues.dateInput);
    if (initialValues.deadline) {
      setDeadline(initialValues.deadline);
    }
    toast.info('Changes cancelled');
  };

  return (
    <Card className="p-6 animate-fade-in">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            value={tempProjectName}
            onChange={(e) => setTempProjectName(e.target.value)}
            placeholder="Enter project name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name</Label>
          <Input
            id="clientName"
            value={tempClientName}
            onChange={(e) => setTempClientName(e.target.value)}
            placeholder="Enter client name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="topics">Topics</Label>
          <Textarea
            id="topics"
            value={tempTopics}
            onChange={(e) => setTempTopics(e.target.value)}
            placeholder="Enter project topics (separate with commas)"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Project Deadline</Label>
          <Input
            type="date"
            value={dateInput}
            onChange={handleDateInputChange}
            className="flex-1"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProjectDetails;