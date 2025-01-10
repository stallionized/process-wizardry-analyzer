import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const LoadingState = () => {
  return (
    <Card className="p-6 flex items-center justify-center min-h-[400px] animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading control chart results...</p>
      </div>
    </Card>
  );
};

export default LoadingState;