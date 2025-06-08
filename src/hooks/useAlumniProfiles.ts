
import { useState, useEffect } from 'react';
import { productionScraper, AlumniProfile } from '@/services/productionScraper';

export const useAlumniProfiles = () => {
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const profileData = await productionScraper.getAlumniProfiles();
      setProfiles(profileData);
      setLoading(false);
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
    const results = await productionScraper.searchAlumniProfiles(query);
    setProfiles(results);
    setLoading(false);
  };

  return { profiles, loading, searchProfiles };
};
