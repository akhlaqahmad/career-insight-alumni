
import { supabase } from '@/integrations/supabase/client';
import { CSVRow } from '@/utils/csvParser';

export interface ScrapingJob {
  id: string;
  filename: string;
  total_profiles: number;
  processed_profiles: number;
  successful_profiles: number;
  failed_profiles: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface AlumniProfile {
  id: string;
  name: string;
  linkedin_url: string;
  current_title?: string;
  current_company?: string;
  industry?: string;
  location?: string;
  about?: string;
  ai_summary?: string;
  skills?: string[];
  experience?: any[];
  education?: any[];
  scraped_at: string;
  last_updated: string;
}

export class ProductionScraper {
  
  async createScrapingJob(filename: string, csvRows: CSVRow[]): Promise<string> {
    // Create the main scraping job
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        filename,
        total_profiles: csvRows.length,
        status: 'pending'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating scraping job:', jobError);
      throw new Error('Failed to create scraping job');
    }

    // Add all URLs to the scraping queue
    const queueItems = csvRows.map(row => ({
      scraping_job_id: job.id,
      linkedin_url: row.linkedin_url,
      name: row.name,
      status: 'pending' as const
    }));

    const { error: queueError } = await supabase
      .from('scraping_queue')
      .insert(queueItems);

    if (queueError) {
      console.error('Error creating queue items:', queueError);
      throw new Error('Failed to create queue items');
    }

    console.log(`Created scraping job ${job.id} with ${csvRows.length} profiles`);
    return job.id;
  }

  async startScrapingJob(jobId: string): Promise<void> {
    console.log(`Starting scraping job: ${jobId}`);
    
    // Call the job processor edge function
    const { error } = await supabase.functions.invoke('job-processor', {
      body: { jobId }
    });

    if (error) {
      console.error('Error starting job processor:', error);
      throw new Error('Failed to start scraping job');
    }
  }

  async getScrapingJob(jobId: string): Promise<ScrapingJob | null> {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error fetching scraping job:', error);
      return null;
    }

    return data;
  }

  async getUserScrapingJobs(): Promise<ScrapingJob[]> {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user scraping jobs:', error);
      return [];
    }

    return data || [];
  }

  async getAlumniProfiles(limit = 100, offset = 0): Promise<AlumniProfile[]> {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select('*')
      .order('scraped_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching alumni profiles:', error);
      return [];
    }

    return data || [];
  }

  async searchAlumniProfiles(query: string): Promise<AlumniProfile[]> {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select('*')
      .or(`name.ilike.%${query}%,current_company.ilike.%${query}%,current_title.ilike.%${query}%`)
      .order('scraped_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error searching alumni profiles:', error);
      return [];
    }

    return data || [];
  }

  // Real-time subscription for job progress
  subscribeToJobProgress(jobId: string, callback: (job: ScrapingJob) => void) {
    return supabase
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
          console.log('Job progress update:', payload);
          callback(payload.new as ScrapingJob);
        }
      )
      .subscribe();
  }

  // Real-time subscription for new profiles
  subscribeToNewProfiles(callback: (profile: AlumniProfile) => void) {
    return supabase
      .channel('new-profiles')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alumni_profiles'
        },
        (payload) => {
          console.log('New profile scraped:', payload);
          callback(payload.new as AlumniProfile);
        }
      )
      .subscribe();
  }
}

export const productionScraper = new ProductionScraper();
