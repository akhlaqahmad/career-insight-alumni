
import { AlumniData } from '@/types/alumni';

const mockCompanies = ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Tesla', 'Netflix', 'Spotify'];
const mockTitles = ['Software Engineer', 'Product Manager', 'Data Scientist', 'Designer', 'Engineering Manager', 'VP Engineering'];
const mockIndustries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Consulting', 'E-commerce'];
const mockLocations = ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Boston, MA', 'Los Angeles, CA'];

const getRandomItem = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

const generateMockProfile = (linkedinUrl: string, name?: string): AlumniData => {
  const id = Math.random().toString(36).substr(2, 9);
  const profileName = name || `Alumni ${Math.floor(Math.random() * 1000)}`;
  const company = getRandomItem(mockCompanies);
  const title = getRandomItem(mockTitles);
  const industry = getRandomItem(mockIndustries);
  const location = getRandomItem(mockLocations);
  
  return {
    id,
    name: profileName,
    linkedinUrl,
    currentTitle: title,
    currentCompany: company,
    industry,
    location,
    about: `Passionate ${title.toLowerCase()} with experience in ${industry.toLowerCase()}. Currently working at ${company} to build innovative solutions.`,
    aiSummary: `Experienced professional in ${industry.toLowerCase()} with strong background in technology and leadership.`,
    education: [
      {
        school: 'University of Technology',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startYear: 2015,
        endYear: 2019
      }
    ],
    experience: [
      {
        title,
        company,
        location,
        startDate: '2022-01',
        endDate: 'Present',
        description: `Leading ${title.toLowerCase()} initiatives at ${company}.`,
        isCurrent: true
      }
    ],
    lastUpdated: new Date().toISOString()
  };
};

export const scrapeLinkedInProfile = async (linkedinUrl: string, name?: string): Promise<AlumniData> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  console.log(`Scraping profile: ${linkedinUrl}`);
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error('Failed to scrape profile - rate limited');
  }
  
  return generateMockProfile(linkedinUrl, name);
};

export const batchScrapeProfiles = async (
  csvRows: { linkedin_url: string; name?: string }[],
  onProgress?: (current: number, total: number, profile?: AlumniData) => void
): Promise<AlumniData[]> => {
  const results: AlumniData[] = [];
  
  for (let i = 0; i < csvRows.length; i++) {
    try {
      const profile = await scrapeLinkedInProfile(csvRows[i].linkedin_url, csvRows[i].name);
      results.push(profile);
      onProgress?.(i + 1, csvRows.length, profile);
    } catch (error) {
      console.error(`Failed to scrape ${csvRows[i].linkedin_url}:`, error);
      onProgress?.(i + 1, csvRows.length);
    }
  }
  
  return results;
};
