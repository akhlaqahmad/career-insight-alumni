import { useState, useEffect } from 'react';
import { productionScraper } from '@/services/productionScraper';
import type { AlumniProfile } from '@/services/productionScraper';

export const useAlumniProfiles = () => {
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const profileData = await productionScraper.getAlumniProfiles();
        setProfiles(profileData);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();

    // Subscribe to new profiles
    const channel = productionScraper.subscribeToNewProfiles((newProfile) => {
      setProfiles(prev => [newProfile, ...prev]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const searchProfiles = async (query: string) => {
    setLoading(true);
    try {
      const results = await productionScraper.searchAlumniProfiles(query);
      setProfiles(results);
    } catch (error) {
      console.error('Error searching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  return { profiles, loading, searchProfiles };
};
