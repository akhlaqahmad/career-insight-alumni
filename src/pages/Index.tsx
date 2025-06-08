import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Papa from 'papaparse';
import { ProductionScraper } from '@/services/productionScraper';
import type { AlumniProfile } from '@/services/productionScraper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { Database, Json } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Upload, Search, Download, Eye, RefreshCw, Filter } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { AlumniTable } from '@/components/AlumniTable';
import { AlumniProfile as AlumniProfileComponent } from '@/components/AlumniProfile';
import { ExportButtons } from '@/components/ExportButtons';
import { FilterControls } from '@/components/FilterControls';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { parseCSV } from '@/utils/csvParser';
import { useAlumniProfiles } from '@/hooks/useAlumniProfiles';
import { useScrapingJob } from '@/hooks/useScrapingJob';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

type CSVRow = {
  name: string;
  linkedin_url: string;
  [key: string]: string;
};

export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profiles: initialProfiles, loading, searchProfiles } = useAlumniProfiles();
  const [filteredData, setFilteredData] = useState<AlumniProfile[]>(initialProfiles);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniProfile | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const { job: currentJob } = useScrapingJob(jobId);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    company: 'all',
    industry: 'all',
    location: 'all'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ processed: 0, total: 0, status: 'pending' });
  const [scrapedProfiles, setScrapedProfiles] = useState<AlumniProfile[]>([]);
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update filtered data when profiles change
  useEffect(() => {
    setFilteredData(initialProfiles);
  }, [initialProfiles]);

  useEffect(() => {
    // Check for job ID in URL
    const urlJobId = searchParams.get('jobId');
    if (urlJobId) {
      setJobId(urlJobId);
      startJobMonitoring(urlJobId);
    }
  }, [searchParams]);

  const startJobMonitoring = (jobId: string) => {
    console.log(`[Index] Starting job monitoring:`, { jobId });

    const scraper = ProductionScraper.getInstance();
    
    // Subscribe to job updates
    scraper.subscribeToJobUpdates(
      jobId,
      (progress) => {
        console.log(`[Index] Job progress update:`, progress);
        setProgress(progress);
      },
      (profile) => {
        console.log(`[Index] New profile scraped:`, {
          id: profile.id,
          name: profile.name
        });
        setScrapedProfiles(prev => [profile, ...prev]);
      },
      (error) => {
        console.error(`[Index] Error in job monitoring:`, {
          error: error.message,
          stack: error.stack
        });
        setError(error.message);
      }
    );

    // Initial job status check
    scraper.getJobStatus(jobId).then(job => {
      console.log(`[Index] Initial job status:`, {
        status: job.status,
        processed: job.processed_profiles,
        total: job.total_profiles
      });
      setProgress({
        processed: job.processed_profiles,
        total: job.total_profiles,
        status: job.status
      });
    }).catch(error => {
      console.error(`[Index] Error fetching initial job status:`, {
        error: error.message,
        stack: error.stack
      });
      setError(error.message);
    });

    // Load existing profiles
    scraper.getScrapedProfiles(jobId).then(profiles => {
      console.log(`[Index] Loaded existing profiles:`, {
        total: profiles.length
      });
      setScrapedProfiles(profiles);
    }).catch(error => {
      console.error(`[Index] Error loading existing profiles:`, {
        error: error.message,
        stack: error.stack
      });
    });
  };

  // Update handleFileUpload to handle File type
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvData = event.target?.result as string;
        Papa.parse<CSVRow>(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const rows: CSVRow[] = results.data;
            console.log(`[Index] Processing CSV file:`, {
              totalRows: rows.length
            });

            // Filter out empty rows and validate data
            const validRows = rows.filter((row) => {
              return row.linkedin_url && row.name;
            });

            if (validRows.length === 0) {
              throw new Error('No valid rows found in CSV file');
            }

            console.log(`[Index] Valid rows found:`, {
              total: validRows.length
            });

            // Create scraping job
            const scraper = ProductionScraper.getInstance();
            const newJobId = await scraper.createJob(file.name, validRows);
            
            console.log(`[Index] Created new job:`, {
              jobId: newJobId,
              totalProfiles: validRows.length
            });

            // Update URL with job ID
            navigate(`/?jobId=${newJobId}`);
            setJobId(newJobId);
            startJobMonitoring(newJobId);
          },
          error: (error) => {
            console.error(`[Index] CSV parsing error:`, {
              error: error.message,
              stack: error.stack
            });
            setError(error.message);
          }
        });
      };
      reader.readAsText(file);
    } catch (error) {
      console.error(`[Index] Error processing file:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      await searchProfiles(term);
    } else {
      // Reset to all profiles
      const scraper = ProductionScraper.getInstance();
      const allProfiles = await scraper.getScrapedProfiles('all');
      setFilteredData(allProfiles);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    applyFilters(searchTerm, newFilters);
  };

  const applyFilters = (search: string, filterObj: typeof filters) => {
    let filtered = initialProfiles;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'processing':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      case 'processing':
        return <AlertCircle className="w-5 h-5 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const fetchProfiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const scraper = ProductionScraper.getInstance();
      const data = await scraper.getAlumniProfiles();
      setProfiles(data);
    } catch (error) {
      console.error(`[Index] Error fetching profiles:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-900">ASB Alumni Career Tracker</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800">Production Ready</Badge>
              <nav className="ml-8 flex space-x-4">
                <Link 
                  to="/" 
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/new-dashboard" 
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  New Dashboard
                </Link>
              </nav>
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
          <AlumniProfileComponent 
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
                  alumniData={initialProfiles}
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

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!jobId && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>
                <p className="text-gray-600 mb-4">
                  Upload a CSV file containing LinkedIn profile URLs and names.
                  The file should have columns: name, linkedin_url
                </p>
                <div className="mb-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
              </Card>
            )}

            {jobId && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Scraping Progress</h2>
                  <div className={`flex items-center ${getStatusColor(progress.status)}`}>
                    {getStatusIcon(progress.status)}
                    <span className="ml-2 capitalize">{progress.status}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Processed: {progress.processed}</span>
                    <span>Total: {progress.total}</span>
                  </div>
                  <Progress value={(progress.processed / progress.total) * 100} />
                </div>
              </Card>
            )}

            {jobId && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Scraped Profiles</h2>
                <div className="space-y-4">
                  {scrapedProfiles.map(profile => (
                    <div key={profile.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{profile.name}</h3>
                      <p className="text-gray-600">{profile.current_title} at {profile.current_company}</p>
                      <p className="text-sm text-gray-500">{profile.location}</p>
                    </div>
                  ))}
                  {scrapedProfiles.length === 0 && (
                    <p className="text-gray-500">No profiles scraped yet.</p>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
