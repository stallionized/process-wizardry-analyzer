import React from 'react';
import { Card } from '@/components/ui/card';

const AIResults = () => {
  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">AI Process Engineer Results</h2>
      <p className="text-muted-foreground">
        Analysis results will appear here after processing your uploaded files.
      </p>
    </Card>
  );
};

export default AIResults;