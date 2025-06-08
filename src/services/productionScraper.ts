import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ScrapingJob = Database['public']['Tables']['scraping_jobs']['Row'];
type ScrapingQueueItem = Database['public']['Tables']['scraping_queue']['Row'];
export type AlumniProfile = Database['public']['Tables']['alumni_profiles']['Row'];

type CSVRow = { name: string; linkedin_url: string; [key: string]: string };

// Hardcoded Supabase configuration
const SUPABASE_URL = "https://zwijoxdlxrprtetpvwqt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3aWpveGRseHJwcnRldHB2d3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNjAzODgsImV4cCI6MjA2NDkzNjM4OH0.dbX06EfZPnSnY1VMqghzMDTTttcouQWSCGnekrn5xak";

export class ProductionScraper {
  private static instance: ProductionScraper;
  private jobId: string | null = null;
  private unsubscribe: (() => void) | null = null;

  private constructor() {}

  static getInstance(): ProductionScraper {
    if (!ProductionScraper.instance) {
      ProductionScraper.instance = new ProductionScraper();
    }
    return ProductionScraper.instance;
  }

  async createJob(filename: string, csvRows: CSVRow[]): Promise<string> {
    try {
      console.log(`[ProductionScraper] Creating new scraping job:`, {
        filename,
        totalProfiles: csvRows.length
      });

      // Create scraping job
      const { data: job, error: jobError } = await supabase
        .from('scraping_jobs')
        .insert({
          filename,
          total_profiles: csvRows.length,
          status: 'pending',
          processed_profiles: 0,
          successful_profiles: 0,
          failed_profiles: 0
        })
        .select()
        .single();

      if (jobError) {
        console.error(`[ProductionScraper] Error creating job:`, {
          error: jobError,
          filename,
          totalProfiles: csvRows.length
        });
        throw jobError;
      }

      console.log(`[ProductionScraper] Job created successfully:`, {
        jobId: job.id,
        filename: job.filename,
        status: job.status
      });

      // Create queue items
      const queueItems = csvRows.map((row, index) => ({
        scraping_job_id: job.id,
        linkedin_url: row.linkedin_url,
        name: row.name,
        priority: index,
        status: "pending" as ScrapingQueueItem["status"]
      }));

      console.log(`[ProductionScraper] Creating ${queueItems.length} queue items`);

      const { error: queueError } = await supabase
        .from('scraping_queue')
        .insert(queueItems);

      if (queueError) {
        console.error(`[ProductionScraper] Error creating queue items:`, {
          error: queueError,
          jobId: job.id,
          totalItems: queueItems.length
        });
        throw queueError;
      }

      console.log(`[ProductionScraper] Queue items created successfully`);

      // Start job processor with correct URL
      const response = await fetch(`${SUPABASE_URL}/functions/v1/job-processor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId: job.id })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`[ProductionScraper] Error starting job processor:`, {
          status: response.status,
          statusText: response.statusText,
          error
        });
        throw new Error(error.message || 'Failed to start job processor');
      }

      console.log(`[ProductionScraper] Job processor started successfully`);

      this.jobId = job.id;
      return job.id;

    } catch (error) {
      console.error(`[ProductionScraper] Error in createJob:`, {
        error: error.message,
        stack: error.stack,
        filename,
        totalProfiles: csvRows.length
      });
      throw error;
    }
  }

  async getScrapingJob(jobId: string): Promise<ScrapingJob> {
    try {
      console.log(`[ProductionScraper] Fetching scraping job:`, { jobId });

      const { data: job, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error(`[ProductionScraper] Error fetching scraping job:`, {
          error,
          jobId
        });
        throw error;
      }

      console.log(`[ProductionScraper] Scraping job:`, {
        jobId,
        status: job.status,
        processed: job.processed_profiles,
        total: job.total_profiles
      });

      return job;

    } catch (error) {
      console.error(`[ProductionScraper] Error in getScrapingJob:`, {
        error: error.message,
        stack: error.stack,
        jobId
      });
      throw error;
    }
  }

  subscribeToJobProgress(jobId: string, callback: (job: ScrapingJob) => void) {
    try {
      console.log(`[ProductionScraper] Subscribing to job progress:`, { jobId });

      const channel = supabase
        .channel(`job-progress-${jobId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'scraping_jobs',
            filter: `id=eq.${jobId}`
          },
          (payload) => {
            console.log(`[ProductionScraper] Job progress update:`, {
              jobId,
              newStatus: payload.new.status,
              processed: payload.new.processed_profiles,
              total: payload.new.total_profiles
            });

            callback(payload.new as ScrapingJob);
          }
        )
        .subscribe();

      return channel;

    } catch (error) {
      console.error(`[ProductionScraper] Error in subscribeToJobProgress:`, {
        error: error.message,
        stack: error.stack,
        jobId
      });
      throw error;
    }
  }

  subscribeToJobUpdates(
    jobId: string,
    onProgress: (progress: { processed: number; total: number; status: string }) => void,
    onNewProfile: (profile: AlumniProfile) => void,
    onError: (error: Error) => void
  ) {
    try {
      console.log(`[ProductionScraper] Subscribing to job updates:`, { jobId });

      // Subscribe to job status changes
      const jobSubscription = supabase
        .channel(`job-${jobId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'scraping_jobs',
            filter: `id=eq.${jobId}`
          },
          (payload) => {
            console.log(`[ProductionScraper] Job status update:`, {
              jobId,
              newStatus: payload.new.status,
              processed: payload.new.processed_profiles,
              total: payload.new.total_profiles
            });

            onProgress({
              processed: payload.new.processed_profiles,
              total: payload.new.total_profiles,
              status: payload.new.status
            });
          }
        )
        .subscribe();

      // Subscribe to new profiles
      const profileSubscription = supabase
        .channel(`profiles-${jobId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'alumni_profiles',
            filter: `scraping_job_id=eq.${jobId}`
          },
          (payload) => {
            console.log(`[ProductionScraper] New profile scraped:`, {
              jobId,
              profileId: payload.new.id,
              name: payload.new.name
            });

            onNewProfile(payload.new as AlumniProfile);
          }
        )
        .subscribe();

      this.unsubscribe = () => {
        console.log(`[ProductionScraper] Unsubscribing from job updates:`, { jobId });
        jobSubscription.unsubscribe();
        profileSubscription.unsubscribe();
      };

    } catch (error) {
      console.error(`[ProductionScraper] Error in subscribeToJobUpdates:`, {
        error: error.message,
        stack: error.stack,
        jobId
      });
      onError(error);
    }
  }

  unsubscribeFromJobUpdates() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.jobId = null;
    }
  }

  async getJobStatus(jobId: string): Promise<ScrapingJob> {
    try {
      console.log(`[ProductionScraper] Fetching job status:`, { jobId });

      const { data: job, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error(`[ProductionScraper] Error fetching job status:`, {
          error,
          jobId
        });
        throw error;
      }

      console.log(`[ProductionScraper] Job status:`, {
        jobId,
        status: job.status,
        processed: job.processed_profiles,
        total: job.total_profiles
      });

      return job;

    } catch (error) {
      console.error(`[ProductionScraper] Error in getJobStatus:`, {
        error: error.message,
        stack: error.stack,
        jobId
      });
      throw error;
    }
  }

  async getQueueItems(jobId: string): Promise<ScrapingQueueItem[]> {
    try {
      console.log(`[ProductionScraper] Fetching queue items:`, { jobId });

      const { data: items, error } = await supabase
        .from('scraping_queue')
        .select('*')
        .eq('scraping_job_id', jobId)
        .order('priority', { ascending: true });

      if (error) {
        console.error(`[ProductionScraper] Error fetching queue items:`, {
          error,
          jobId
        });
        throw error;
      }

      console.log(`[ProductionScraper] Queue items:`, {
        jobId,
        totalItems: items.length,
        statuses: items.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {})
      });

      return items;

    } catch (error) {
      console.error(`[ProductionScraper] Error in getQueueItems:`, {
        error: error.message,
        stack: error.stack,
        jobId
      });
      throw error;
    }
  }

  async getScrapedProfiles(jobId: string): Promise<AlumniProfile[]> {
    try {
      console.log(`[ProductionScraper] Fetching scraped profiles:`, { jobId });

      const { data: profiles, error } = await supabase
        .from('alumni_profiles')
        .select('*')
        .eq('scraping_job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`[ProductionScraper] Error fetching profiles:`, {
          error,
          jobId
        });
        throw error;
      }

      console.log(`[ProductionScraper] Scraped profiles:`, {
        jobId,
        totalProfiles: profiles.length
      });

      return profiles;

    } catch (error) {
      console.error(`[ProductionScraper] Error in getScrapedProfiles:`, {
        error: error.message,
        stack: error.stack,
        jobId
      });
      throw error;
    }
  }

  async getAlumniProfiles(): Promise<AlumniProfile[]> {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async searchAlumniProfiles(query: string): Promise<AlumniProfile[]> {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select('*')
      .or(`name.ilike.%${query}%,current_company.ilike.%${query}%,current_title.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  subscribeToNewProfiles(callback: (profile: AlumniProfile) => void) {
    return supabase
      .channel('alumni_profiles')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'alumni_profiles' },
        (payload) => callback(payload.new as AlumniProfile)
      )
      .subscribe();
  }
}

export const productionScraper = ProductionScraper.getInstance();
