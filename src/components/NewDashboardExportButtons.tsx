
import { Button } from '@/components/ui/button';
import { Download, FileText, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AlumniProfile {
  name: string;
  title: string;
  linkedinUrl: string;
  imageUrl: string;
  connection: string | undefined;
}

interface NewDashboardExportButtonsProps {
  data: AlumniProfile[];
  searchQuery: string;
  filters: {
    company: string;
    industry: string;
    location: string;
  };
}

export const NewDashboardExportButtons = ({ data, searchQuery, filters }: NewDashboardExportButtonsProps) => {
  // Helper function to extract company from title
  const extractCompany = (title: string) => {
    const companyMatch = title.match(/at\s+([^|,]+)/i);
    return companyMatch ? companyMatch[1].trim() : '';
  };

  // Helper function to extract industry from title
  const extractIndustry = (title: string) => {
    const industryKeywords = ['Banking', 'Finance', 'Technology', 'Consulting', 'Education', 'Healthcare', 'Energy', 'Insurance', 'Telecommunications', 'Manufacturing', 'Retail', 'Media', 'Real Estate', 'Government'];
    for (const keyword of industryKeywords) {
      if (title.toLowerCase().includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
    return '';
  };

  // Generate filename with current filters
  const generateFilename = (extension: string) => {
    const date = new Date().toISOString().split('T')[0];
    const hasFilters = searchQuery || filters.company !== 'all' || filters.industry !== 'all' || filters.location !== 'all';
    const filterSuffix = hasFilters ? '_filtered' : '';
    return `asb_alumni_${date}${filterSuffix}.${extension}`;
  };

  const exportToCSV = () => {
    const headers = [
      'Name',
      'Title',
      'Company',
      'Industry', 
      'LinkedIn URL',
      'Image URL',
      'Connection'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(alumni => [
        `"${alumni.name}"`,
        `"${alumni.title}"`,
        `"${extractCompany(alumni.title)}"`,
        `"${extractIndustry(alumni.title)}"`,
        `"${alumni.linkedinUrl}"`,
        `"${alumni.imageUrl}"`,
        `"${alumni.connection || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generateFilename('csv');
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
    const enrichedData = data.map(alumni => ({
      ...alumni,
      company: extractCompany(alumni.title),
      industry: extractIndustry(alumni.title),
      exported_at: new Date().toISOString()
    }));

    const jsonContent = JSON.stringify({
      metadata: {
        total_records: data.length,
        exported_at: new Date().toISOString(),
        filters_applied: {
          search: searchQuery || null,
          company: filters.company !== 'all' ? filters.company : null,
          industry: filters.industry !== 'all' ? filters.industry : null,
          location: filters.location !== 'all' ? filters.location : null
        }
      },
      data: enrichedData
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generateFilename('json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "JSON Export Successful",
      description: `Exported ${data.length} alumni records to JSON.`,
    });
  };

  const exportToExcel = () => {
    const headers = [
      'Name',
      'Title',
      'Company',
      'Industry',
      'LinkedIn URL',
      'Image URL',
      'Connection'
    ];

    // Create Excel-compatible CSV with BOM for proper UTF-8 encoding
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join('\t'), // Use tabs for better Excel compatibility
      ...data.map(alumni => [
        alumni.name,
        alumni.title,
        extractCompany(alumni.title),
        extractIndustry(alumni.title),
        alumni.linkedinUrl,
        alumni.imageUrl,
        alumni.connection || ''
      ].join('\t'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generateFilename('xls');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Excel Export Successful",
      description: `Exported ${data.length} alumni records to Excel.`,
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-slate-600 mr-2">
        Export {data.length} records:
      </span>
      <Button variant="outline" size="sm" onClick={exportToCSV}>
        <FileText className="h-4 w-4 mr-2" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportToJSON}>
        <Database className="h-4 w-4 mr-2" />
        JSON
      </Button>
      <Button variant="outline" size="sm" onClick={exportToExcel}>
        <Download className="h-4 w-4 mr-2" />
        Excel
      </Button>
    </div>
  );
};
