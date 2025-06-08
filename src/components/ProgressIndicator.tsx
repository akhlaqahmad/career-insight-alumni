
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export const ProgressIndicator = () => {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
      <Card className="p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <div className="flex-1 min-w-64">
            <p className="text-sm font-medium text-slate-700 mb-2">Processing Alumni Data...</p>
            <Progress value={65} className="h-2" />
            <p className="text-xs text-slate-500 mt-1">Scraping LinkedIn profiles and generating AI summaries</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
