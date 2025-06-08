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
import { NewDashboardExportButtons } from '@/components/NewDashboardExportButtons';
import AlumniDetailsPage from '@/components/AlumniDetailsPage';

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
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniProfile | null>(null);

  // Improved CSV parsing function
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Handle escaped quotes
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  };

  // Improved company extraction
  const extractCompany = (title: string) => {
    if (!title) return null;
    
    // Clean the title first
    const cleanTitle = title.replace(/\s+/g, ' ').trim();
    
    // Multiple patterns to match company names
    const patterns = [
      /(?:at|@)\s+([^|,\n]+?)(?:\s*\||$)/i,  // "at Company" or "@Company"
      /(?:^|\s)([A-Z][^|,\n]*?(?:Inc|LLC|Corp|Ltd|Co\.|Company|Group|Holdings))(?:\s*\||$)/i,
      /(?:^|\s)([A-Z][a-zA-Z\s&]{2,30})(?:\s*\||$)/i  // Generic company pattern
    ];
    
    for (const pattern of patterns) {
      const match = cleanTitle.match(pattern);
      if (match) {
        const company = match[1].trim();
        // Filter out common non-company words
        if (company && !['The', 'And', 'Or', 'In', 'On', 'At', 'To', 'For'].includes(company)) {
          return company;
        }
      }
    }
    
    return null;
  };

  // Improved industry extraction
  const extractIndustry = (title: string) => {
    if (!title) return null;
    
    const industryKeywords = [
      'Banking', 'Finance', 'Financial Services', 'Investment', 'Wealth Management',
      'Technology', 'Tech', 'Software', 'IT', 'Information Technology',
      'Consulting', 'Advisory', 'Strategy',
      'Education', 'Academic', 'University', 'School',
      'Healthcare', 'Medical', 'Health', 'Pharmaceutical',
      'Energy', 'Oil', 'Gas', 'Renewable',
      'Insurance', 'Assurance',
      'Telecommunications', 'Telecom',
      'Manufacturing', 'Industrial',
      'Retail', 'E-commerce', 'Sales',
      'Media', 'Marketing', 'Advertising',
      'Real Estate', 'Property',
      'Government', 'Public Sector', 'Non-profit'
    ];
    
    const titleLower = title.toLowerCase();
    for (const keyword of industryKeywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
    
    return null;
  };

  // Improved LinkedIn image URL construction
  const constructLinkedInImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    
    console.log('Processing image path:', imagePath);
    
    // Try to extract LinkedIn profile ID patterns
    const patterns = [
      /(\d{13})/,  // 13-digit LinkedIn IDs
      /(\d{10,15})/,  // Other common ID lengths
      /AQ[A-Za-z0-9_-]+/,  // LinkedIn AQ IDs
      /profile-displayphoto.*?(\w+)/  // Display photo IDs
    ];
    
    for (const pattern of patterns) {
      const match = imagePath.match(pattern);
      if (match) {
        const id = match[1] || match[0];
        // Try different LinkedIn CDN formats
        const possibleUrls = [
          `https://media.licdn.com/dms/image/v2/D5603AQF${id}/profile-displayphoto-shrink_400_400/0/${id}?e=1755129600&v=beta&t=placeholder`,
          `https://media.licdn.com/dms/image/${id}/profile-displayphoto-shrink_400_400/0/?e=1755129600&v=beta&t=placeholder`,
          `https://media.licdn.com/dms/image/v2/${id}/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/?e=1755129600&v=beta&t=placeholder`
        ];
        
        console.log(`Generated image URLs for ${id}:`, possibleUrls);
        return possibleUrls[0]; // Return the first one for now
      }
    }
    
    return '';
  };

  useEffect(() => {
    const loadAlumniData = async () => {
      try {
        console.log('Starting to load alumni data...');
        const response = await fetch('/data/alumni_profiles.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
        }
        const csv = await response.text();
        
        console.log('CSV content loaded, length:', csv.length);
        console.log('First 500 chars:', csv.substring(0, 500));
        
        // Split into lines and remove header
        const lines = csv.split('\n').filter(line => line.trim());
        console.log('Total lines (including header):', lines.length);
        
        if (lines.length < 2) {
          throw new Error('CSV file appears to be empty or only contains headers');
        }
        
        // Process each line (skip header)
        const profiles: AlumniProfile[] = [];
        const errors: string[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          try {
            console.log(`Processing line ${i}:`, line.substring(0, 100) + '...');
            
            // Parse the CSV line
            const fields = parseCSVLine(line);
            console.log(`Parsed ${fields.length} fields:`, fields.map(f => f.substring(0, 50)));
            
            if (fields.length < 3) {
              console.warn(`Line ${i} has insufficient fields (${fields.length}):`, fields);
              continue;
            }
            
            // Extract and validate fields
            const name = fields[0]?.replace(/^"|"$/g, '').trim() || '';
            const title = fields[1]?.replace(/^"|"$/g, '').trim() || '';
            const linkedinUrl = fields[2]?.replace(/^"|"$/g, '').trim() || '';
            const imageUrl = fields[3]?.replace(/^"|"$/g, '').trim() || '';
            const connection = fields[4]?.replace(/^"|"$/g, '').trim() || undefined;
            
            console.log(`Extracted data for line ${i}:`, { name, title: title.substring(0, 50), linkedinUrl, imageUrl: imageUrl.substring(0, 50), connection });
            
            // Validate required fields
            if (!name || !linkedinUrl) {
              console.warn(`Line ${i} missing required fields - name: "${name}", linkedinUrl: "${linkedinUrl}"`);
              continue;
            }
            
            // Validate LinkedIn URL format
            if (!linkedinUrl.includes('linkedin.com')) {
              console.warn(`Line ${i} has invalid LinkedIn URL: "${linkedinUrl}"`);
              continue;
            }
            
            // Construct image URL
            const constructedImageUrl = constructLinkedInImageUrl(imageUrl);
            console.log(`Constructed image URL for ${name}:`, constructedImageUrl);
            
            const profile: AlumniProfile = {
              name,
              title,
              linkedinUrl,
              imageUrl: constructedImageUrl,
              connection
            };
            
            profiles.push(profile);
            console.log(`Successfully added profile for ${name}`);
            
          } catch (parseError) {
            const errorMsg = `Failed to parse line ${i}: ${parseError}`;
            console.error(errorMsg, line);
            errors.push(errorMsg);
          }
        }
        
        console.log(`Successfully parsed ${profiles.length} profiles`);
        console.log('Sample profiles:', profiles.slice(0, 3));
        
        if (errors.length > 0) {
          console.warn(`Encountered ${errors.length} parsing errors:`, errors.slice(0, 5));
        }
        
        if (profiles.length === 0) {
          throw new Error('No valid alumni profiles could be parsed from the CSV file');
        }
        
        setAlumni(profiles);
        
      } catch (err) {
        console.error('Error loading alumni data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load alumni data. Please check the console for details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAlumniData();
  }, []);

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

  // Handle alumni card click
  const handleAlumniClick = (alumniProfile: AlumniProfile) => {
    setSelectedAlumni(alumniProfile);
  };

  // Handle back navigation
  const handleBackToList = () => {
    setSelectedAlumni(null);
  };

  // Show details page if an alumni is selected
  if (selectedAlumni) {
    return (
      <AlumniDetailsPage 
        alumni={selectedAlumni} 
        onBack={handleBackToList}
        extractCompany={extractCompany}
        extractIndustry={extractIndustry}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertTitle>Error Loading Alumni Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
          <Link to="/" className="text-blue-600 font-medium">Alumni Network</Link>
          <Link to="/old-dashboard" className="text-slate-600 hover:text-slate-900">Old Dashboard</Link>
        </nav>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col gap-4">
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
          
          {/* Export Buttons */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <NewDashboardExportButtons 
              data={filteredAlumni} 
              searchQuery={searchQuery}
              filters={filters}
            />
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
          <Card 
            key={`${profile.linkedinUrl}-${index}`} 
            className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
            onClick={() => handleAlumniClick(profile)}
          >
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-blue-100">
                    {profile.imageUrl ? (
                      <img
                        src={profile.imageUrl}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          console.log(`Image failed to load for ${profile.name}:`, profile.imageUrl);
                          const target = e.target as HTMLImageElement;
                          const fallback = target.parentElement?.querySelector('.initials-fallback') as HTMLElement;
                          if (fallback) {
                            target.style.display = 'none';
                            fallback.style.display = 'flex';
                          }
                        }}
                        onLoad={() => {
                          console.log(`Image loaded successfully for ${profile.name}`);
                        }}
                      />
                    ) : null}
                    <span 
                      className="initials-fallback text-2xl font-bold text-blue-600 flex items-center justify-center h-full w-full"
                      style={{ display: profile.imageUrl ? 'none' : 'flex' }}
                    >
                      {profile.name.split(' ').map(n => n[0]?.toUpperCase()).filter(Boolean).join('').substring(0, 2)}
                    </span>
                  </div>
                  {profile.connection && (
                    <div className="absolute -bottom-1 -right-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {profile.connection}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-slate-900 truncate" title={profile.name}>
                    {profile.name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-3" title={profile.title}>
                    {profile.title || 'No title available'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {extractCompany(profile.title) && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100" title={`Company: ${extractCompany(profile.title)}`}>
                        <Building2 className="h-3 w-3 mr-1" />
                        {extractCompany(profile.title)}
                      </Badge>
                    )}
                    {extractIndustry(profile.title) && (
                      <Badge variant="outline" className="border-slate-200 text-slate-600" title={`Industry: ${extractIndustry(profile.title)}`}>
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {extractIndustry(profile.title)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <div className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Click to view details
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredAlumni.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No alumni found matching your criteria.</p>
          <p className="text-slate-400 text-sm mt-2">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
