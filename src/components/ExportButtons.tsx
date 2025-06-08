
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { AlumniData } from '@/types/alumni';
import { toast } from '@/hooks/use-toast';

interface ExportButtonsProps {
  data: AlumniData[];
}

export const ExportButtons = ({ data }: ExportButtonsProps) => {
  const exportToCSV = () => {
    const headers = [
      'Name',
      'Current Title',
      'Current Company',
      'Industry',
      'Location',
      'LinkedIn URL',
      'AI Summary',
      'Last Updated'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(alumni => [
        `"${alumni.name}"`,
        `"${alumni.currentTitle}"`,
        `"${alumni.currentCompany}"`,
        `"${alumni.industry}"`,
        `"${alumni.location}"`,
        `"${alumni.linkedinUrl}"`,
        `"${alumni.aiSummary}"`,
        `"${alumni.lastUpdated}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alumni_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "CSV Export Successful",
      description: `Exported ${data.length} alumni records to CSV.`,
    });
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alumni_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "JSON Export Successful",
      description: `Exported ${data.length} alumni records to JSON.`,
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={exportToCSV}>
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button variant="outline" onClick={exportToJSON}>
        <Download className="h-4 w-4 mr-2" />
        Export JSON
      </Button>
    </div>
  );
};
