import React from 'react';
import { Card } from '@/components/ui/card';

interface ExternalComplaintsProps {
  projectId: string;
}

const ExternalComplaints = ({ projectId }: ExternalComplaintsProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">External Complaints Analysis</h2>
      <p className="text-muted-foreground">
        External complaints analysis will be available soon.
      </p>
    </Card>
  );
};

export default ExternalComplaints;