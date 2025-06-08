
export interface AlumniData {
  id: string;
  name: string;
  linkedinUrl: string;
  currentTitle: string;
  currentCompany: string;
  industry: string;
  location: string;
  about: string;
  aiSummary: string;
  education: Education[];
  experience: Experience[];
  lastUpdated: string;
  profilePicture?: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  startYear: number;
  endYear: number;
}

export interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrent: boolean;
}
