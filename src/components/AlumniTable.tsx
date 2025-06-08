
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, RefreshCw, ExternalLink } from 'lucide-react';
import { AlumniProfile } from '@/services/productionScraper';

interface AlumniTableProps {
  data: AlumniProfile[];
  onViewProfile: (alumni: AlumniProfile) => void;
  onRefreshProfile: (id: string) => void;
}

export const AlumniTable = ({ data, onViewProfile, onRefreshProfile }: AlumniTableProps) => {
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    await onRefreshProfile(id);
    setRefreshingId(null);
  };

  const getIndustryColor = (industry?: string) => {
    if (!industry) return 'bg-gray-100 text-gray-800';
    
    const colors = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Financial Services': 'bg-green-100 text-green-800',
      'Consulting': 'bg-purple-100 text-purple-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Education': 'bg-yellow-100 text-yellow-800',
    };
    return colors[industry as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">No alumni profiles found. Upload a CSV file to start scraping LinkedIn profiles.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-4 px-6 font-semibold text-slate-900">Name</th>
              <th className="text-left py-4 px-6 font-semibold text-slate-900">Current Role</th>
              <th className="text-left py-4 px-6 font-semibold text-slate-900">Company</th>
              <th className="text-left py-4 px-6 font-semibold text-slate-900">Industry</th>
              <th className="text-left py-4 px-6 font-semibold text-slate-900">Location</th>
              <th className="text-left py-4 px-6 font-semibold text-slate-900">AI Summary</th>
              <th className="text-left py-4 px-6 font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((alumni) => (
              <tr key={alumni.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600">
                        {alumni.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{alumni.name}</div>
                      <div className="text-sm text-slate-500">Updated {formatDate(alumni.last_updated)}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm font-medium text-slate-900">{alumni.current_title || 'N/A'}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm font-medium text-slate-900">{alumni.current_company || 'N/A'}</div>
                </td>
                <td className="py-4 px-6">
                  <Badge className={getIndustryColor(alumni.industry)}>
                    {alumni.industry || 'Unknown'}
                  </Badge>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm text-slate-600">{alumni.location || 'N/A'}</div>
                </td>
                <td className="py-4 px-6 max-w-xs">
                  <div className="text-sm text-slate-600 truncate">{alumni.ai_summary || 'No summary available'}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewProfile(alumni)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRefresh(alumni.id)}
                      disabled={refreshingId === alumni.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshingId === alumni.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(alumni.linkedin_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
