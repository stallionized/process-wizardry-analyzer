import React from 'react';
import { Card } from '@/components/ui/card';

interface TrendsAndThemesProps {
  projectId: string;
}

const TrendsAndThemes = ({ projectId }: TrendsAndThemesProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Trends & Themes Analysis</h2>
      <p className="text-muted-foreground">
        Trends and themes analysis will be displayed here.
      </p>
    </Card>
  );
};

export default TrendsAndThemes;