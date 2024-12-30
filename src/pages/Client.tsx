import React from 'react';
import { Card } from '@/components/ui/card';

const Client = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
        <p className="text-muted-foreground">
          View shared process engineering analyses
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Shared Analyses</h2>
        <p className="text-muted-foreground">
          No analyses have been shared with you yet.
        </p>
      </Card>
    </div>
  );
};

export default Client;