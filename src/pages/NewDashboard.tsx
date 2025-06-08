import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Search, Filter, MapPin, Building2, GraduationCap, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AlumniProfile {
  name: string;
  title: string;
  linkedinUrl: string;
  imageUrl: string;
  connection: string | undefined;
}

export default function NewDashboard() {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    company: 'all',
    industry: 'all',
    location: 'all'
  });

  useEffect(() => {
    const loadAlumniData = async () => {
      try {
        const response = await fetch('/data/alumni_profiles.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch CSV file');
        }
        const csv = await response.text();
        
        // Parse CSV with error handling
        try {
          const rows = csv.split('\n').slice(1); // Skip header
          const profiles = rows
            .filter(row => row.trim()) // Skip empty rows
            .map(row => {
              try {
                // Split by comma but respect quoted fields
                const fields = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                const [name, title, linkedinUrl, imageUrl, connection] = fields.map(field => 
                  field.replace(/^"|"$/g, '').trim() // Remove quotes and trim
                );
                
                return {
                  name: name || '',
                  title: title || '',
                  linkedinUrl: linkedinUrl || '',
                  imageUrl: imageUrl || '',
                  connection: connection || undefined
                };
              } catch (parseError) {
                console.warn('Failed to parse row:', row);
                return null;
              }
            })
            .filter((profile): profile is AlumniProfile => 
              profile !== null && 
              Boolean(profile.name) && 
              Boolean(profile.linkedinUrl)
            );
          
          setAlumni(profiles);
        } catch (parseError) {
          throw new Error('Failed to parse CSV data. Please check the file format.');
        }
      } catch (err) {
        console.error('Error loading alumni data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load alumni data');
      } finally {
        setIsLoading(false);
      }
    };

    loadAlumniData();
  }, []);

  // Extract companies and industries from titles
  const extractCompany = (title: string) => {
    const companyMatch = title.match(/at\s+([^|,]+)/i);
    return companyMatch ? companyMatch[1].trim() : null;
  };

  const extractIndustry = (title: string) => {
    const industryKeywords = ['Banking', 'Finance', 'Technology', 'Consulting', 'Education', 'Healthcare', 'Energy', 'Insurance', 'Telecommunications', 'Manufacturing', 'Retail', 'Media', 'Real Estate', 'Government'];
    for (const keyword of industryKeywords) {
      if (title.toLowerCase().includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
    return null;
  };

  const filteredAlumni = alumni.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const company = extractCompany(profile.title);
    const matchesCompany = filters.company === 'all' || 
      (company && company.toLowerCase().includes(filters.company.toLowerCase()));
    
    const industry = extractIndustry(profile.title);
    const matchesIndustry = filters.industry === 'all' || 
      (industry && industry.toLowerCase().includes(filters.industry.toLowerCase()));
    
    return matchesSearch && matchesCompany && matchesIndustry;
  });

  // Get unique values for filters
  const companies = [...new Set(alumni.map(a => extractCompany(a.title)).filter(Boolean))].sort();
  const industries = [...new Set(alumni.map(a => extractIndustry(a.title)).filter(Boolean))].sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ASB Alumni Network</h1>
          <p className="text-slate-600 mt-1">Connect with fellow alumni and explore career opportunities</p>
        </div>
        <nav className="flex items-center space-x-4">
          <Link to="/" className="text-slate-600 hover:text-slate-900">Main Dashboard</Link>
          <Link to="/new-dashboard" className="text-blue-600 font-medium">New Version</Link>
        </nav>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search by name or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.company}
              onValueChange={(value) => setFilters(prev => ({ ...prev, company: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.industry}
              onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{filteredAlumni.length}</div>
            <div className="text-sm text-slate-600">Total Alumni</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {new Set(filteredAlumni.map(a => extractCompany(a.title)).filter(Boolean)).size}
            </div>
            <div className="text-sm text-slate-600">Companies</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {new Set(filteredAlumni.map(a => extractIndustry(a.title)).filter(Boolean)).size}
            </div>
            <div className="text-sm text-slate-600">Industries</div>
          </div>
        </Card>
      </div>

      {/* Alumni Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlumni.map((profile, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-blue-100">
                    {profile.imageUrl ? (
                      <img
                        src={profile.imageUrl}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">
                        {profile.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  {profile.connection && (
                    <div className="absolute -bottom-1 -right-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {profile.connection}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-slate-900 truncate">
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      {profile.name}
                    </a>
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{profile.title}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {extractCompany(profile.title) && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {extractCompany(profile.title)}
                      </Badge>
                    )}
                    {extractIndustry(profile.title) && (
                      <Badge variant="outline" className="border-slate-200 text-slate-600">
                        {extractIndustry(profile.title)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                View LinkedIn Profile
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 