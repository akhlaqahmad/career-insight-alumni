
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, MapPin, Building2, GraduationCap, Calendar, Mail } from 'lucide-react';

interface AlumniProfile {
  name: string;
  title: string;
  linkedinUrl: string;
  imageUrl: string;
  connection: string | undefined;
}

interface AlumniDetailsPageProps {
  alumni: AlumniProfile;
  onBack: () => void;
  extractCompany: (title: string) => string | null;
  extractIndustry: (title: string) => string | null;
}

export default function AlumniDetailsPage({ alumni, onBack, extractCompany, extractIndustry }: AlumniDetailsPageProps) {
  const company = extractCompany(alumni.title);
  const industry = extractIndustry(alumni.title);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Alumni Network
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.open(alumni.linkedinUrl, '_blank')}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View LinkedIn Profile
        </Button>
      </div>

      {/* Main profile card */}
      <Card className="mb-8">
        <CardHeader className="pb-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="h-32 w-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center overflow-hidden ring-4 ring-blue-100">
                {alumni.imageUrl ? (
                  <img
                    src={alumni.imageUrl}
                    alt={alumni.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const fallback = target.parentElement?.querySelector('.initials-fallback') as HTMLElement;
                      if (fallback) {
                        target.style.display = 'none';
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <span 
                  className="initials-fallback text-4xl font-bold text-blue-600 flex items-center justify-center h-full w-full"
                  style={{ display: alumni.imageUrl ? 'none' : 'flex' }}
                >
                  {alumni.name.split(' ').map(n => n[0]?.toUpperCase()).filter(Boolean).join('').substring(0, 2)}
                </span>
              </div>
              {alumni.connection && (
                <div className="absolute -bottom-2 -right-2 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
                  {alumni.connection}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-slate-900 mb-3">
                {alumni.name}
              </CardTitle>
              <p className="text-xl text-slate-600 mb-4 leading-relaxed">
                {alumni.title || 'No title available'}
              </p>
              
              <div className="flex flex-wrap gap-3 mb-4">
                {company && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm px-3 py-1">
                    <Building2 className="h-4 w-4 mr-2" />
                    {company}
                  </Badge>
                )}
                {industry && (
                  <Badge variant="outline" className="border-slate-200 text-slate-600 text-sm px-3 py-1">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    {industry}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contact & LinkedIn Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Professional Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ExternalLink className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">LinkedIn Profile</p>
                <p className="text-sm text-slate-600">Connect and view full professional profile</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => window.open(alumni.linkedinUrl, '_blank')}
                className="flex items-center gap-2"
              >
                Visit Profile
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Current Position</h3>
              <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">
                {alumni.title || 'No current position information available'}
              </p>
            </div>
            
            {company && (
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Company</h3>
                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-4 rounded-lg">
                  <Building2 className="h-4 w-4" />
                  {company}
                </div>
              </div>
            )}
            
            {industry && (
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Industry</h3>
                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-4 rounded-lg">
                  <GraduationCap className="h-4 w-4" />
                  {industry}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ASB Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            ASB Alumni Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Asia School of Business Alumni</h3>
                <p className="text-slate-600">
                  Part of the prestigious ASB network of business leaders and entrepreneurs
                </p>
                {alumni.connection && (
                  <p className="text-sm text-blue-600 mt-1 font-medium">
                    Connection Level: {alumni.connection}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
