
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RefreshCw, ExternalLink, MapPin, Calendar } from 'lucide-react';
import { AlumniData } from '@/types/alumni';

interface AlumniProfileProps {
  alumni: AlumniData;
  onBack: () => void;
  onRefresh: () => void;
}

export const AlumniProfile = ({ alumni, onBack, onRefresh }: AlumniProfileProps) => {
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
            onClick={() => window.open(alumni.linkedinUrl, '_blank')}
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
            <p className="text-xl text-slate-600 mb-3">{alumni.currentTitle}</p>
            <p className="text-lg font-medium text-slate-700 mb-4">{alumni.currentCompany}</p>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {alumni.location}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Last updated: {alumni.lastUpdated}
              </div>
            </div>
            <div className="mt-4">
              <Badge className="bg-blue-100 text-blue-800">{alumni.industry}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* About & AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">About</h2>
          <p className="text-slate-600 leading-relaxed">{alumni.about}</p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Summary</h2>
          <p className="text-slate-600 leading-relaxed">{alumni.aiSummary}</p>
        </Card>
      </div>

      {/* Experience */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Professional Experience</h2>
        <div className="space-y-6">
          {alumni.experience.map((exp, index) => (
            <div key={index} className="relative">
              {index > 0 && <Separator className="mb-6" />}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">
                      {exp.company.split(' ')[0].slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-slate-900">{exp.title}</h3>
                    {exp.isCurrent && (
                      <Badge className="bg-green-100 text-green-800">Current</Badge>
                    )}
                  </div>
                  <p className="text-slate-700 font-medium mb-1">{exp.company}</p>
                  <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                    <span>{exp.startDate} - {exp.endDate}</span>
                    <span>•</span>
                    <span>{exp.location}</span>
                  </div>
                  <p className="text-slate-600">{exp.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Education */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Education</h2>
        <div className="space-y-4">
          {alumni.education.map((edu, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {edu.school.split(' ')[0].slice(0, 1)}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">{edu.degree} in {edu.field}</h3>
                <p className="text-slate-600">{edu.school}</p>
                <p className="text-sm text-slate-500">{edu.startYear} - {edu.endYear}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
