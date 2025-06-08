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
      
      console.log(`[Job Processor] Starting job: ${jobId}`)
      
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError) {
        console.error(`[Job Processor] Error fetching job details:`, jobError)
        throw jobError
      }

      console.log(`[Job Processor] Job details:`, {
        filename: job.filename,
        total_profiles: job.total_profiles,
        status: job.status
      })
      
      // Update job status to processing
      const { error: updateError } = await supabase
        .from('scraping_jobs')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (updateError) {
        console.error(`[Job Processor] Error updating job status:`, updateError)
        throw updateError
      }

      console.log(`[Job Processor] Updated job status to processing`)

      // Get all pending queue items for this job
      const { data: queueItems, error: queueError } = await supabase
        .from('scraping_queue')
        .select('*')
        .eq('scraping_job_id', jobId)
        .eq('status', 'pending')
        .order('priority', { ascending: false })

      if (queueError) {
        console.error(`[Job Processor] Error fetching queue items:`, queueError)
        throw queueError
      }

      console.log(`[Job Processor] Found ${queueItems?.length || 0} pending items to process`)

      if (!queueItems || queueItems.length === 0) {
        console.log(`[Job Processor] No pending items found, marking job as completed`)
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
      let successfulScrapes = 0
      let failedScrapes = 0

      for (const item of queueItems) {
        try {
          console.log(`[Job Processor] Processing item:`, {
            url: item.linkedin_url,
            name: item.name,
            attempts: item.attempts
          })

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

          const responseData = await scrapeResponse.json()
          console.log(`[Job Processor] Scraper response:`, responseData)

          if (!scrapeResponse.ok) {
            console.error(`[Job Processor] Failed to scrape ${item.linkedin_url}:`, {
              status: scrapeResponse.status,
              statusText: scrapeResponse.statusText,
              error: responseData.error
            })
            failedScrapes++

            // Update queue item as failed
            await supabase
              .from('scraping_queue')
              .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: responseData.error || 'Failed to scrape profile'
              })
              .eq('scraping_job_id', jobId)
              .eq('linkedin_url', item.linkedin_url)
          } else {
            successfulScrapes++
            console.log(`[Job Processor] Successfully scraped ${item.linkedin_url}`)
          }

          // Update job progress
          const { error: progressError } = await supabase
            .from('scraping_jobs')
            .update({
              processed_profiles: job.processed_profiles + 1,
              successful_profiles: job.successful_profiles + (scrapeResponse.ok ? 1 : 0),
              failed_profiles: job.failed_profiles + (scrapeResponse.ok ? 0 : 1)
            })
            .eq('id', jobId)

          if (progressError) {
            console.error(`[Job Processor] Error updating job progress:`, progressError)
          }

          // Rate limiting - wait 3 seconds between requests
          await new Promise(resolve => setTimeout(resolve, 3000))

        } catch (error) {
          console.error(`[Job Processor] Error processing ${item.linkedin_url}:`, {
            error: error.message,
            stack: error.stack
          })
          failedScrapes++

          // Update queue item as failed
          await supabase
            .from('scraping_queue')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: error.message
            })
            .eq('scraping_job_id', jobId)
            .eq('linkedin_url', item.linkedin_url)
        }
      }

      console.log(`[Job Processor] Completed processing batch:`, {
        total: queueItems.length,
        successful: successfulScrapes,
        failed: failedScrapes
      })

      // Check if job is complete
      const { data: remainingItems, error: remainingError } = await supabase
        .from('scraping_queue')
        .select('count')
        .eq('scraping_job_id', jobId)
        .eq('status', 'pending')

      if (remainingError) {
        console.error(`[Job Processor] Error checking remaining items:`, remainingError)
      }

      if (!remainingItems || remainingItems.length === 0) {
        console.log(`[Job Processor] No remaining items, marking job as completed`)
        await supabase
          .from('scraping_jobs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: queueItems.length,
          successful: successfulScrapes,
          failed: failedScrapes
        }),
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
    console.error('[Job Processor] Function error:', {
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
