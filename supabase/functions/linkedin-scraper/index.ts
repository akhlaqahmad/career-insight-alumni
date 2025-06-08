
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

interface ScrapingRequest {
  jobId: string
  linkedinUrl: string
  name?: string
}

interface LinkedInProfile {
  name: string
  currentTitle: string
  currentCompany: string
  location: string
  about: string
  profilePictureUrl?: string
  experience: any[]
  education: any[]
  skills: string[]
  industry: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (req.method === 'POST') {
      const { jobId, linkedinUrl, name }: ScrapingRequest = await req.json()
      
      console.log(`Starting scrape for ${linkedinUrl}`)
      
      // Update queue item status to processing
      await supabase
        .from('scraping_queue')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('scraping_job_id', jobId)
        .eq('linkedin_url', linkedinUrl)

      try {
        // Simulate real scraping (replace with actual Puppeteer implementation)
        const profile = await scrapeLinkedInProfile(linkedinUrl)
        
        // Generate AI summary using Gemini if configured
        let aiSummary = ''
        if (geminiApiKey && profile) {
          aiSummary = await generateGeminiSummary(profile)
        }
        
        // Save to alumni_profiles table
        const { data: savedProfile, error: saveError } = await supabase
          .from('alumni_profiles')
          .upsert({
            name: profile.name,
            linkedin_url: linkedinUrl,
            current_title: profile.currentTitle,
            current_company: profile.currentCompany,
            industry: profile.industry,
            location: profile.location,
            about: profile.about,
            profile_picture_url: profile.profilePictureUrl,
            ai_summary: aiSummary,
            skills: profile.skills,
            experience: profile.experience,
            education: profile.education,
            scraping_job_id: jobId,
            raw_data: profile
          }, {
            onConflict: 'linkedin_url'
          })

        if (saveError) {
          console.error('Error saving profile:', saveError)
          throw saveError
        }

        // Update queue item as completed
        await supabase
          .from('scraping_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            scraped_data: profile
          })
          .eq('scraping_job_id', jobId)
          .eq('linkedin_url', linkedinUrl)

        console.log(`Successfully scraped ${linkedinUrl}`)
        
        return new Response(
          JSON.stringify({ success: true, profile: savedProfile }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (scrapeError) {
        console.error(`Error scraping ${linkedinUrl}:`, scrapeError)
        
        // Update queue item as failed
        await supabase
          .from('scraping_queue')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: scrapeError.message
          })
          .eq('scraping_job_id', jobId)
          .eq('linkedin_url', linkedinUrl)

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: scrapeError.message 
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
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function scrapeLinkedInProfile(url: string): Promise<LinkedInProfile> {
  // This is a simplified mock - in production, you'd use Puppeteer
  // with proper anti-detection measures, proxy rotation, etc.
  
  console.log(`Scraping LinkedIn profile: ${url}`)
  
  // Simulate scraping delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
  
  // Mock profile data - replace with real Puppeteer scraping
  const mockProfiles = [
    {
      name: "Sarah Johnson",
      currentTitle: "Senior Product Manager",
      currentCompany: "Google",
      location: "San Francisco, CA",
      about: "Experienced product manager with 8+ years in tech, specializing in user experience and data-driven product development.",
      industry: "Technology",
      skills: ["Product Management", "User Research", "Data Analysis", "Agile"],
      experience: [
        {
          title: "Senior Product Manager",
          company: "Google",
          location: "Mountain View, CA",
          startDate: "2022-01",
          endDate: "Present",
          isCurrent: true,
          description: "Leading product strategy for search experiences"
        }
      ],
      education: [
        {
          school: "Stanford University",
          degree: "MBA",
          field: "Business Administration",
          startYear: 2018,
          endYear: 2020
        }
      ]
    },
    {
      name: "Michael Chen",
      currentTitle: "Senior Software Engineer",
      currentCompany: "Microsoft",
      location: "Seattle, WA",
      about: "Full-stack developer passionate about building scalable web applications and mentoring junior developers.",
      industry: "Technology",
      skills: ["JavaScript", "React", "Node.js", "Python", "AWS"],
      experience: [
        {
          title: "Senior Software Engineer",
          company: "Microsoft",
          location: "Redmond, WA",
          startDate: "2021-03",
          endDate: "Present",
          isCurrent: true,
          description: "Building cloud-native applications for Azure platform"
        }
      ],
      education: [
        {
          school: "UC Berkeley",
          degree: "BS",
          field: "Computer Science",
          startYear: 2016,
          endYear: 2020
        }
      ]
    }
  ]
  
  // Return random mock profile
  const profile = mockProfiles[Math.floor(Math.random() * mockProfiles.length)]
  
  // Add some randomization to make it more realistic
  profile.name = `${profile.name} (${Math.floor(Math.random() * 1000)})`
  
  return profile
}

async function generateGeminiSummary(profile: LinkedInProfile): Promise<string> {
  if (!geminiApiKey) {
    return "AI summary unavailable - Gemini API key not configured"
  }

  try {
    const prompt = `
    Analyze this LinkedIn profile and create a concise professional summary:
    
    Name: ${profile.name}
    Current Role: ${profile.currentTitle} at ${profile.currentCompany}
    Location: ${profile.location}
    Industry: ${profile.industry}
    About: ${profile.about}
    Skills: ${profile.skills.join(', ')}
    
    Experience:
    ${profile.experience.map(exp => `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})`).join('\n')}
    
    Education:
    ${profile.education.map(edu => `- ${edu.degree} in ${edu.field} from ${edu.school}`).join('\n')}
    
    Provide a 2-3 sentence professional summary highlighting key strengths, career progression, and potential value to organizations.
    `

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        }
      })
    })

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text())
      return "AI summary generation failed"
    }

    const data = await response.json()
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim()
    } else {
      console.error('Unexpected Gemini response format:', data)
      return "AI summary generation failed"
    }

  } catch (error) {
    console.error('Error generating Gemini summary:', error)
    return "AI summary generation failed"
  }
}
