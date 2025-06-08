
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RefreshCw, ExternalLink, MapPin, Calendar } from 'lucide-react';
import { AlumniProfile as AlumniProfileType } from '@/services/productionScraper';

interface AlumniProfileProps {
  alumni: AlumniProfileType;
  onBack: () => void;
  onRefresh: () => void;
}

export const AlumniProfile = ({ alumni, onBack, onRefresh }: AlumniProfileProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper functions to safely handle JSON data
  const getExperienceArray = () => {
    if (Array.isArray(alumni.experience)) {
      return alumni.experience as any[];
    }
    return [];
  };

  const getEducationArray = () => {
    if (Array.isArray(alumni.education)) {
      return alumni.education as any[];
    }
    return [];
  };

  const experienceArray = getExperienceArray();
  const educationArray = getEducationArray();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Alumni List
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Profile
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open(alumni.linkedin_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View LinkedIn
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <Card className="p-8">
        <div className="flex items-start space-x-6">
          <div className="h-24 w-24 bg-slate-200 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-600">
              {alumni.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{alumni.name}</h1>
            <p className="text-xl text-slate-600 mb-3">{alumni.current_title || 'N/A'}</p>
            <p className="text-lg font-medium text-slate-700 mb-4">{alumni.current_company || 'N/A'}</p>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {alumni.location || 'N/A'}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Last updated: {formatDate(alumni.last_updated)}
              </div>
            </div>
            <div className="mt-4">
              <Badge className="bg-blue-100 text-blue-800">{alumni.industry || 'Unknown'}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* About & AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">About</h2>
          <p className="text-slate-600 leading-relaxed">{alumni.about || 'No about information available.'}</p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Summary</h2>
          <p className="text-slate-600 leading-relaxed">{alumni.ai_summary || 'No AI summary available.'}</p>
        </Card>
      </div>

      {/* Experience */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Professional Experience</h2>
        {experienceArray.length > 0 ? (
          <div className="space-y-6">
            {experienceArray.map((exp: any, index: number) => (
              <div key={index} className="relative">
                {index > 0 && <Separator className="mb-6" />}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600">
                        {exp.company ? exp.company.split(' ')[0].slice(0, 2).toUpperCase() : 'CO'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-slate-900">{exp.title || 'N/A'}</h3>
                      {exp.isCurrent && (
                        <Badge className="bg-green-100 text-green-800">Current</Badge>
                      )}
                    </div>
                    <p className="text-slate-700 font-medium mb-1">{exp.company || 'N/A'}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                      <span>{exp.startDate || 'N/A'} - {exp.endDate || 'Present'}</span>
                      {exp.location && (
                        <>
                          <span>•</span>
                          <span>{exp.location}</span>
                        </>
                      )}
                    </div>
                    <p className="text-slate-600">{exp.description || 'No description available.'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No experience information available.</p>
        )}
      </Card>

      {/* Education */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Education</h2>
        {educationArray.length > 0 ? (
          <div className="space-y-4">
            {educationArray.map((edu: any, index: number) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {edu.school ? edu.school.split(' ')[0].slice(0, 1) : 'S'}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">
                    {edu.degree || 'Degree'} {edu.field ? `in ${edu.field}` : ''}
                  </h3>
                  <p className="text-slate-600">{edu.school || 'Unknown School'}</p>
                  <p className="text-sm text-slate-500">
                    {edu.startYear || 'N/A'} - {edu.endYear || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No education information available.</p>
        )}
      </Card>
    </div>
  );
};
