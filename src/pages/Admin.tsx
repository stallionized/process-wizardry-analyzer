import React from 'react';
import { Card } from '@/components/ui/card';

const Admin = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and review process engineering analyses
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Saved Analyses</h2>
        <p className="text-muted-foreground">
          No analyses saved yet. Upload files and run analysis to get started.
        </p>
      </Card>
    </div>
  );
};

export default Admin;