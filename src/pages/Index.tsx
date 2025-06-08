
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
import { parseCSV } from '@/utils/csvParser';
import { productionScraper } from '@/services/productionScraper';
import { useAlumniProfiles } from '@/hooks/useAlumniProfiles';
import { useScrapingJob } from '@/hooks/useScrapingJob';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { profiles, loading, searchProfiles } = useAlumniProfiles();
  const [filteredData, setFilteredData] = useState(profiles);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { job: currentJob } = useScrapingJob(currentJobId);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    company: 'all',
    industry: 'all',
    location: 'all'
  });

  // Update filtered data when profiles change
  useState(() => {
    setFilteredData(profiles);
  }, [profiles]);

  const handleFileUpload = async (file: File) => {
    try {
      console.log('Starting real scraping job for:', file.name);
      
      const csvRows = await parseCSV(file);
      console.log('Parsed CSV rows:', csvRows.length);
      
      // Create scraping job in database
      const jobId = await productionScraper.createScrapingJob(file.name, csvRows);
      setCurrentJobId(jobId);
      
      // Start the scraping process
      await productionScraper.startScrapingJob(jobId);
      
      toast({
        title: "Scraping Job Started",
        description: `Processing ${csvRows.length} LinkedIn profiles. This may take several minutes.`,
      });
      
    } catch (error) {
      console.error('Error starting scraping job:', error);
      toast({
        title: "Error",
        description: "Failed to start scraping job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      await searchProfiles(term);
    } else {
      // Reset to all profiles
      const allProfiles = await productionScraper.getAlumniProfiles();
      setFilteredData(allProfiles);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    applyFilters(searchTerm, newFilters);
  };

  const applyFilters = (search: string, filterObj: typeof filters) => {
    let filtered = profiles;

    if (search) {
      filtered = filtered.filter(alumni =>
        alumni.name.toLowerCase().includes(search.toLowerCase()) ||
        alumni.current_company?.toLowerCase().includes(search.toLowerCase()) ||
        alumni.current_title?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterObj.company !== 'all') {
      filtered = filtered.filter(alumni =>
        alumni.current_company?.toLowerCase().includes(filterObj.company.toLowerCase())
      );
    }

    if (filterObj.industry !== 'all') {
      filtered = filtered.filter(alumni =>
        alumni.industry?.toLowerCase().includes(filterObj.industry.toLowerCase())
      );
    }

    if (filterObj.location !== 'all') {
      filtered = filtered.filter(alumni =>
        alumni.location?.toLowerCase().includes(filterObj.location.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleRefreshProfile = async (id: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Profile refresh functionality will be available in the next update.",
    });
  };

  const isProcessing = currentJob && currentJob.status === 'processing';
  const processingProgress = currentJob ? {
    current: currentJob.processed_profiles,
    total: currentJob.total_profiles
  } : { current: 0, total: 0 };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-900">ASB Alumni Career Tracker</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800">Production Ready</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <FileUpload onFileUpload={handleFileUpload} />
              <ExportButtons data={filteredData} />
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      {isProcessing && (
        <ProgressIndicator 
          current={processingProgress.current} 
          total={processingProgress.total} 
        />
      )}

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
            {/* Current Job Status */}
            {currentJob && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      Scraping Job: {currentJob.filename}
                    </h3>
                    <p className="text-blue-700">
                      Status: {currentJob.status} | 
                      Progress: {currentJob.processed_profiles}/{currentJob.total_profiles} | 
                      Success: {currentJob.successful_profiles} | 
                      Failed: {currentJob.failed_profiles}
                    </p>
                  </div>
                  <Badge className={
                    currentJob.status === 'completed' ? 'bg-green-100 text-green-800' :
                    currentJob.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    currentJob.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {currentJob.status.toUpperCase()}
                  </Badge>
                </div>
              </Card>
            )}

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
                  alumniData={profiles}
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
                    {new Set(filteredData.map(a => a.current_company).filter(Boolean)).size}
                  </div>
                  <div className="text-sm text-slate-600">Companies</div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {new Set(filteredData.map(a => a.industry).filter(Boolean)).size}
                  </div>
                  <div className="text-sm text-slate-600">Industries</div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {new Set(filteredData.map(a => a.location).filter(Boolean)).size}
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
