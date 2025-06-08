/// <reference types="https://deno.land/x/deno@v1.40.5/mod.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!

interface ScrapingRequest {
  jobId: string
  linkedinUrl: string
  name: string
}

interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  school: string;
  degree: string;
  field: string;
  year: string;
}

interface LinkedInProfile {
  name: string;
  currentTitle: string;
  currentCompany: string;
  industry: string;
  location: string;
  about: string;
  profilePictureUrl: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

async function scrapeLinkedInProfile(url: string, name: string): Promise<LinkedInProfile> {
  console.log(`[LinkedIn Scraper] Starting scrape for ${name} (${url})`)
  
  try {
    // First, try to get the profile data from our database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: existingProfile } = await supabase
      .from('alumni_profiles')
      .select('*')
      .eq('linkedin_url', url)
      .single();

    if (existingProfile) {
      console.log(`[LinkedIn Scraper] Found existing profile in database`);
      return {
        name: existingProfile.name,
        currentTitle: existingProfile.current_title,
        currentCompany: existingProfile.current_company,
        industry: existingProfile.industry,
        location: existingProfile.location,
        about: existingProfile.about,
        profilePictureUrl: existingProfile.profile_picture_url,
        skills: existingProfile.skills,
        experience: existingProfile.experience,
        education: existingProfile.education
      };
    }

    // If no existing profile, try to scrape
    console.log(`[LinkedIn Scraper] No existing profile found, attempting to scrape`);
    
    // Add a delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'DNT': '1',
        'Cookie': 'li_at=' + Deno.env.get('LINKEDIN_COOKIE') // Add LinkedIn authentication cookie
      }
    });

    if (!response.ok) {
      if (response.status === 999) {
        throw new Error('LinkedIn is blocking automated requests. Please try again later or use a different approach.');
      }
      throw new Error(`Failed to fetch LinkedIn profile: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract profile data using regex patterns
    const profile = {
      name: extractText(html, /<h1[^>]*>([^<]+)<\/h1>/) || name,
      currentTitle: extractText(html, /<div[^>]*class="[^"]*text-heading-xlarge[^"]*"[^>]*>([^<]+)<\/div>/),
      currentCompany: extractText(html, /<div[^>]*class="[^"]*text-body-medium[^"]*"[^>]*>([^<]+)<\/div>/),
      industry: extractText(html, /<div[^>]*class="[^"]*text-body-small[^"]*"[^>]*>([^<]+)<\/div>/),
      location: extractText(html, /<div[^>]*class="[^"]*text-body-small[^"]*"[^>]*>([^<]+)<\/div>/),
      about: extractText(html, /<div[^>]*class="[^"]*display-flex[^"]*"[^>]*>([^<]+)<\/div>/s),
      profilePictureUrl: extractAttribute(html, /<img[^>]*class="[^"]*presence-entity__image[^"]*"[^>]*src="([^"]+)"/),
      skills: extractArray(html, /<span[^>]*class="[^"]*skill[^"]*"[^>]*>([^<]+)<\/span>/g),
      experience: extractExperience(html),
      education: extractEducation(html)
    };

    // Save the scraped profile to database
    await supabase
      .from('alumni_profiles')
      .insert({
        name: profile.name,
        linkedin_url: url,
        current_title: profile.currentTitle,
        current_company: profile.currentCompany,
        industry: profile.industry,
        location: profile.location,
        about: profile.about,
        profile_picture_url: profile.profilePictureUrl,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education
      });

    return profile;

  } catch (error) {
    console.error(`[LinkedIn Scraper] Error scraping profile:`, error);
    throw error;
  }
}

function extractText(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match ? match[1].trim() : '';
}

function extractAttribute(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match ? match[1].trim() : '';
}

function extractArray(html: string, pattern: RegExp): string[] {
  const matches = html.matchAll(pattern);
  return Array.from(matches).map(match => match[1].trim());
}

function extractExperience(html: string): Experience[] {
  const experienceSection = html.match(/<section[^>]*class="[^"]*experience-section[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  if (!experienceSection) return [];

  const experiences: Experience[] = [];
  const experienceMatches = experienceSection[1].matchAll(/<div[^>]*class="[^"]*experience-item[^"]*"[^>]*>([\s\S]*?)<\/div>/g);

  for (const match of experienceMatches) {
    const title = extractText(match[1], /<h3[^>]*>([^<]+)<\/h3>/);
    const company = extractText(match[1], /<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/);
    const duration = extractText(match[1], /<span[^>]*class="[^"]*duration[^"]*"[^>]*>([^<]+)<\/span>/);
    const description = extractText(match[1], /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/);

    if (title || company) {
      experiences.push({
        title,
        company,
        duration,
        description
      });
    }
  }

  return experiences;
}

function extractEducation(html: string): Education[] {
  const educationSection = html.match(/<section[^>]*class="[^"]*education-section[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  if (!educationSection) return [];

  const educations: Education[] = [];
  const educationMatches = educationSection[1].matchAll(/<div[^>]*class="[^"]*education-item[^"]*"[^>]*>([\s\S]*?)<\/div>/g);

  for (const match of educationMatches) {
    const school = extractText(match[1], /<h3[^>]*>([^<]+)<\/h3>/);
    const degree = extractText(match[1], /<span[^>]*class="[^"]*degree[^"]*"[^>]*>([^<]+)<\/span>/);
    const field = extractText(match[1], /<span[^>]*class="[^"]*field[^"]*"[^>]*>([^<]+)<\/span>/);
    const year = extractText(match[1], /<span[^>]*class="[^"]*year[^"]*"[^>]*>([^<]+)<\/span>/);

    if (school) {
      educations.push({
        school,
        degree,
        field,
        year
      });
    }
  }

  return educations;
}

async function generateGeminiSummary(profile: LinkedInProfile): Promise<{ summary: string; careerInsights: string[] }> {
  console.log(`[LinkedIn Scraper] Generating AI summary for ${profile.name}`)
  
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const prompt = `Analyze this LinkedIn profile and provide a professional summary and career insights:
    Name: ${profile.name}
    Current Title: ${profile.currentTitle}
    Current Company: ${profile.currentCompany}
    Industry: ${profile.industry}
    Location: ${profile.location}
    About: ${profile.about}
    Skills: ${profile.skills.join(', ')}
    Experience: ${JSON.stringify(profile.experience)}
    Education: ${JSON.stringify(profile.education)}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY // Changed from Authorization to x-goog-api-key
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[LinkedIn Scraper] Gemini API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to generate AI summary: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GeminiResponse;
    const generatedText = data.candidates[0].content.parts[0].text;

    // Parse the generated text to extract summary and insights
    const summary = generatedText.split('\n\n')[0];
    const careerInsights = generatedText
      .split('\n\n')[1]
      ?.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace('-', '').trim());

    return {
      summary,
      careerInsights: careerInsights || []
    };
  } catch (error) {
    console.error(`[LinkedIn Scraper] Error generating AI summary:`, error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (req.method === 'POST') {
      const { jobId, linkedinUrl, name }: ScrapingRequest = await req.json()
      
      console.log(`[LinkedIn Scraper] Received request:`, {
        jobId,
        linkedinUrl,
        name
      })

      try {
        // Scrape LinkedIn profile
        console.log(`[LinkedIn Scraper] Starting profile scrape`)
        const profile = await scrapeLinkedInProfile(linkedinUrl, name)
        console.log(`[LinkedIn Scraper] Profile scraped successfully:`, {
          name: profile.name,
          currentTitle: profile.currentTitle,
          currentCompany: profile.currentCompany
        })

        // Generate AI summary
        console.log(`[LinkedIn Scraper] Generating AI summary`)
        const aiSummary = await generateGeminiSummary(profile)
        console.log(`[LinkedIn Scraper] AI summary generated successfully`)

        // Save profile to database
        console.log(`[LinkedIn Scraper] Saving profile to database`)
        const { error: saveError } = await supabase
          .from('alumni_profiles')
          .insert({
            scraping_job_id: jobId,
            name: profile.name,
            current_title: profile.currentTitle,
            current_company: profile.currentCompany,
            industry: profile.industry,
            location: profile.location,
            about: profile.about,
            profile_picture_url: profile.profilePictureUrl,
            skills: profile.skills,
            experience: profile.experience,
            education: profile.education,
            ai_summary: aiSummary.summary,
            career_insights: aiSummary.careerInsights,
            linkedin_url: linkedinUrl
          })

        if (saveError) {
          console.error(`[LinkedIn Scraper] Error saving profile:`, {
            error: saveError,
            profile: {
              name: profile.name,
              currentTitle: profile.currentTitle,
              currentCompany: profile.currentCompany
            }
          })
          throw saveError
        }

        console.log(`[LinkedIn Scraper] Profile saved successfully`)

        // Update queue item status
        console.log(`[LinkedIn Scraper] Updating queue item status`)
        const { error: updateError } = await supabase
          .from('scraping_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('scraping_job_id', jobId)
          .eq('linkedin_url', linkedinUrl)

        if (updateError) {
          console.error(`[LinkedIn Scraper] Error updating queue item:`, updateError)
          throw updateError
        }

        console.log(`[LinkedIn Scraper] Queue item updated successfully`)

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Profile scraped and saved successfully',
            profile: {
              name: profile.name,
              currentTitle: profile.currentTitle,
              currentCompany: profile.currentCompany
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (error) {
        console.error(`[LinkedIn Scraper] Error processing profile:`, {
          error: error.message,
          stack: error.stack,
          jobId,
          linkedinUrl,
          name
        })

        // Update queue item status to failed
        await supabase
          .from('scraping_queue')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error.message
          })
          .eq('scraping_job_id', jobId)
          .eq('linkedin_url', linkedinUrl)

        return new Response(
          JSON.stringify({ 
            success: false,
            error: error.message
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    )

  } catch (error) {
    console.error('[LinkedIn Scraper] Function error:', {
      message: error.message,
      stack: error.stack
    })
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
