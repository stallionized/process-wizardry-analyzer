import React from 'react';
import { Card } from '@/components/ui/card';

const RecycleBin = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Recycle Bin</h1>
        <p className="text-muted-foreground">
          Deleted projects can be restored or permanently removed from here
        </p>
      </div>

      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          No deleted projects yet.
        </div>
      </Card>
    </div>
  );
};

export default RecycleBin;