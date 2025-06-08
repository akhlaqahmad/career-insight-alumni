
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Building2, GraduationCap, Brain, DollarSign, Star, MessageCircle, Smile, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AlumniProfile {
  name: string;
  title: string;
  linkedinUrl: string;
  imageUrl: string;
  connection: string | undefined;
}

interface AIGeneratedData {
  currentTitle: string;
  industry: string;
  overachieverScore: number;
  overachieverReason: string;
  predictedIncome: string;
  seniorityScore: number;
  introScript: string;
  personalizedJoke: string;
}

interface AlumniDetailsPageProps {
  alumni: AlumniProfile;
  onBack: () => void;
  extractCompany: (title: string) => string | null;
  extractIndustry: (title: string) => string | null;
}

export default function AlumniDetailsPage({ alumni, onBack, extractCompany, extractIndustry }: AlumniDetailsPageProps) {
  const [aiData, setAiData] = useState<AIGeneratedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const company = extractCompany(alumni.title);
  const industry = extractIndustry(alumni.title);

  const generateAIInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const prompt = `Analyze this professional profile and provide personalized insights:

Name: ${alumni.name}
Current Title: ${alumni.title}
Company: ${company || 'Unknown'}
Industry: ${industry || 'Unknown'}
LinkedIn: ${alumni.linkedinUrl}

Please provide the following information in JSON format:
{
  "currentTitle": "Extract or infer current title (e.g., CEO, Director)",
  "industry": "Identify the industry they work in",
  "overachieverScore": "Rate 1-10 based on their profile achievements",
  "overachieverReason": "Specific reason for the score, be direct",
  "predictedIncome": "Estimate income range (add * for estimates)",
  "seniorityScore": "Rate 1-10 seniority level, 10 being highest",
  "introScript": "Professional DM intro: 'Hi, I'm from the Asia School of Business Alumni team, wanted to reach out to you since you're {personalize based on their profile}'",
  "personalizedJoke": "A light, professional joke related to their industry/role to start conversation"
}

Make reasonable estimates where data is limited and add * for guesses.`;

      const response = await fetch('/api/generate-ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI insights');
      }

      const data = await response.json();
      setAiData(JSON.parse(data.insights));
    } catch (err) {
      console.error('Error generating AI insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateAIInsights();
  }, [alumni]);

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

      {/* AI Insights Loading */}
      {isLoading && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-slate-600">Generating AI insights...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights Error */}
      {error && (
        <Alert className="mb-8">
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateAIInsights} 
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* AI-Generated Insights */}
      {aiData && (
        <>
          {/* Professional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Overachiever Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {aiData.overachieverScore}/10
                </div>
                <p className="text-sm text-slate-600">{aiData.overachieverReason}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Predicted Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {aiData.predictedIncome}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Seniority Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {aiData.seniorityScore}/10
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Intro Script
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-slate-700 italic">"{aiData.introScript}"</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => navigator.clipboard.writeText(aiData.introScript)}
                >
                  Copy Script
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Smile className="h-5 w-5 text-orange-500" />
                  Ice Breaker Joke
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-slate-700 italic">"{aiData.personalizedJoke}"</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => navigator.clipboard.writeText(aiData.personalizedJoke)}
                >
                  Copy Joke
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

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
                {aiData?.currentTitle || alumni.title || 'No current position information available'}
              </p>
            </div>
            
            {(company || aiData?.industry) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {company && (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">Company</h3>
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-4 rounded-lg">
                      <Building2 className="h-4 w-4" />
                      {company}
                    </div>
                  </div>
                )}
                
                {aiData?.industry && (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">Industry</h3>
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-4 rounded-lg">
                      <GraduationCap className="h-4 w-4" />
                      {aiData.industry}
                    </div>
                  </div>
                )}
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
