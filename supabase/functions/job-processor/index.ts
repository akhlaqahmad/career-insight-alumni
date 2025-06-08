
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ProcessJobRequest {
  jobId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (req.method === 'POST') {
      const { jobId }: ProcessJobRequest = await req.json()
      
      console.log(`Processing job: ${jobId}`)
      
      // Update job status to processing
      await supabase
        .from('scraping_jobs')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', jobId)

      // Get all pending queue items for this job
      const { data: queueItems, error: queueError } = await supabase
        .from('scraping_queue')
        .select('*')
        .eq('scraping_job_id', jobId)
        .eq('status', 'pending')
        .order('priority', { ascending: false })

      if (queueError) {
        console.error('Error fetching queue items:', queueError)
        throw queueError
      }

      if (!queueItems || queueItems.length === 0) {
        // Mark job as completed if no pending items
        await supabase
          .from('scraping_jobs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId)

        return new Response(
          JSON.stringify({ success: true, message: 'No pending items to process' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Process items with rate limiting (1 request per 3 seconds to avoid being blocked)
      for (const item of queueItems) {
        try {
          // Call the linkedin-scraper function
          const scrapeResponse = await fetch(`${supabaseUrl}/functions/v1/linkedin-scraper`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jobId: jobId,
              linkedinUrl: item.linkedin_url,
              name: item.name
            })
          })

          if (!scrapeResponse.ok) {
            console.error(`Failed to scrape ${item.linkedin_url}:`, scrapeResponse.status)
          }

          // Rate limiting - wait 3 seconds between requests
          await new Promise(resolve => setTimeout(resolve, 3000))

        } catch (error) {
          console.error(`Error processing ${item.linkedin_url}:`, error)
        }
      }

      // Check if job is complete
      const { data: remainingItems } = await supabase
        .from('scraping_queue')
        .select('count')
        .eq('scraping_job_id', jobId)
        .eq('status', 'pending')

      if (!remainingItems || remainingItems.length === 0) {
        await supabase
          .from('scraping_jobs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId)
      }

      return new Response(
        JSON.stringify({ success: true, processed: queueItems.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    )

  } catch (error) {
    console.error('Job processor error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
