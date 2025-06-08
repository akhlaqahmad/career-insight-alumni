import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Search, Download, Eye, RefreshCw, Filter } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { AlumniTable } from '@/components/AlumniTable';
import { AlumniProfile } from '@/components/AlumniProfile';
import { ExportButtons } from '@/components/ExportButtons';
import { FilterControls } from '@/components/FilterControls';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { AlumniData } from '@/types/alumni';
import { mockAlumniData } from '@/data/mockData';

const Index = () => {
  const [alumniData, setAlumniData] = useState<AlumniData[]>(mockAlumniData);
  const [filteredData, setFilteredData] = useState<AlumniData[]>(mockAlumniData);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    company: 'all',
    industry: 'all',
    location: 'all'
  });

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsProcessing(false);
    // In real implementation, this would parse CSV and trigger scraping
    console.log('File uploaded:', file.name);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, filters);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    applyFilters(searchTerm, newFilters);
  };

  const applyFilters = (search: string, filterObj: typeof filters) => {
    let filtered = alumniData;

    if (search) {
      filtered = filtered.filter(alumni =>
        alumni.name.toLowerCase().includes(search.toLowerCase()) ||
        alumni.currentCompany.toLowerCase().includes(search.toLowerCase()) ||
        alumni.currentTitle.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterObj.company !== 'all') {
      filtered = filtered.filter(alumni =>
        alumni.currentCompany.toLowerCase().includes(filterObj.company.toLowerCase())
      );
    }

    if (filterObj.industry !== 'all') {
      filtered = filtered.filter(alumni =>
        alumni.industry.toLowerCase().includes(filterObj.industry.toLowerCase())
      );
    }

    if (filterObj.location !== 'all') {
      filtered = filtered.filter(alumni =>
        alumni.location.toLowerCase().includes(filterObj.location.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleRefreshProfile = async (id: string) => {
    setIsProcessing(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    console.log('Refreshing profile:', id);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-900">ASB Alumni Career Tracker</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">Demo Mode</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <FileUpload onFileUpload={handleFileUpload} />
              <ExportButtons data={filteredData} />
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      {isProcessing && <ProgressIndicator />}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedAlumni ? (
          <AlumniProfile 
            alumni={selectedAlumni} 
            onBack={() => setSelectedAlumni(null)}
            onRefresh={() => handleRefreshProfile(selectedAlumni.id)}
          />
        ) : (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search by name, company, or job title..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <FilterControls 
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  alumniData={alumniData}
                />
              </div>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{filteredData.length}</div>
                  <div className="text-sm text-slate-600">Total Alumni</div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {new Set(filteredData.map(a => a.currentCompany)).size}
                  </div>
                  <div className="text-sm text-slate-600">Companies</div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {new Set(filteredData.map(a => a.industry)).size}
                  </div>
                  <div className="text-sm text-slate-600">Industries</div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {new Set(filteredData.map(a => a.location)).size}
                  </div>
                  <div className="text-sm text-slate-600">Locations</div>
                </div>
              </Card>
            </div>

            {/* Alumni Table */}
            <AlumniTable 
              data={filteredData}
              onViewProfile={setSelectedAlumni}
              onRefreshProfile={handleRefreshProfile}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
