/// <reference types="https://deno.land/x/deno@v1.40.5/mod.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ScrapingRequest {
  jobId: string
  linkedinUrl: string
  name: string
}

// Mock function to simulate scraping a LinkedIn profile
async function scrapeLinkedInProfile(url: string, name: string) {
  console.log(`[LinkedIn Scraper] Starting scrape for ${name} (${url})`)
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Return mock profile data
  return {
    name,
    currentTitle: "Software Engineer",
    currentCompany: "Tech Corp",
    industry: "Technology",
    location: "San Francisco, CA",
    about: "Experienced software engineer with a passion for building scalable applications.",
    profilePictureUrl: "https://example.com/profile.jpg",
    skills: ["JavaScript", "TypeScript", "React", "Node.js"],
    experience: [
      {
        title: "Software Engineer",
        company: "Tech Corp",
        duration: "2020 - Present",
        description: "Building scalable web applications"
      }
    ],
    education: [
      {
        school: "University of Technology",
        degree: "Bachelor of Science in Computer Science",
        year: "2020"
      }
    ]
  }
}

// Mock function to simulate generating AI summary
async function generateGeminiSummary(profile: any) {
  console.log(`[LinkedIn Scraper] Generating AI summary for ${profile.name}`)
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    summary: `${profile.name} is a ${profile.currentTitle} at ${profile.currentCompany} with expertise in ${profile.skills.join(', ')}.`,
    careerInsights: [
      "Strong technical background in web development",
      "Experience with modern JavaScript frameworks",
      "Proven track record of delivering scalable solutions"
    ]
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
