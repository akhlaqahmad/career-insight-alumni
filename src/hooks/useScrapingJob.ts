
import { useState, useEffect } from 'react';
import { productionScraper, ScrapingJob } from '@/services/productionScraper';

export const useScrapingJob = (jobId: string | null) => {
  const [job, setJob] = useState<ScrapingJob | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      setLoading(true);
      const jobData = await productionScraper.getScrapingJob(jobId);
      setJob(jobData);
      setLoading(false);
    };

    fetchJob();

    // Subscribe to real-time updates
    const channel = productionScraper.subscribeToJobProgress(jobId, (updatedJob) => {
      setJob(updatedJob);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [jobId]);

  return { job, loading };
};
