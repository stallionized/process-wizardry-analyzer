import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface ProjectDetailsProps {
  projectName: string;
  setProjectName: (value: string) => void;
  clientName: string;
  setClientName: (value: string) => void;
  deadline: Date | undefined;
  setDeadline: (date: Date | undefined) => void;
}

const ProjectDetails = ({
  projectName,
  setProjectName,
  clientName,
  setClientName,
  deadline,
  setDeadline
}: ProjectDetailsProps) => {
  const [dateInput, setDateInput] = useState(deadline ? format(deadline, 'yyyy-MM-dd') : '');

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInput(value);
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      setDeadline(date);
    }
  };

  return (
    <Card className="p-6 animate-fade-in">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name</Label>
          <Input
            id="clientName"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Enter client name"
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
      </div>
    </Card>
  );
};

export default ProjectDetails;