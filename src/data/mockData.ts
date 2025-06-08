
import { AlumniData } from '@/types/alumni';

export const mockAlumniData: AlumniData[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    linkedinUrl: 'https://linkedin.com/in/sarahchen',
    currentTitle: 'Senior Product Manager',
    currentCompany: 'Meta',
    industry: 'Technology',
    location: 'San Francisco, CA',
    about: 'Passionate product manager with 8+ years of experience building consumer-facing products that impact millions of users. Expertise in data-driven product decisions, user research, and cross-functional team leadership.',
    aiSummary: 'Experienced product leader focused on consumer technology with strong data analytics background and proven track record of scaling products.',
    education: [
      {
        school: 'Stanford Graduate School of Business',
        degree: 'MBA',
        field: 'Business Administration',
        startYear: 2018,
        endYear: 2020
      },
      {
        school: 'UC Berkeley',
        degree: 'BS',
        field: 'Computer Science',
        startYear: 2012,
        endYear: 2016
      }
    ],
    experience: [
      {
        title: 'Senior Product Manager',
        company: 'Meta',
        location: 'Menlo Park, CA',
        startDate: '2021-03',
        endDate: 'Present',
        description: 'Leading product strategy for Instagram Stories, managing cross-functional teams of 15+ engineers and designers.',
        isCurrent: true
      },
      {
        title: 'Product Manager',
        company: 'Uber',
        location: 'San Francisco, CA',
        startDate: '2020-06',
        endDate: '2021-02',
        description: 'Owned rider experience for core marketplace, improved conversion rates by 15%.',
        isCurrent: false
      },
      {
        title: 'Associate Product Manager',
        company: 'Google',
        location: 'Mountain View, CA',
        startDate: '2016-08',
        endDate: '2018-05',
        description: 'Worked on YouTube monetization features, launched creator fund program.',
        isCurrent: false
      }
    ],
    lastUpdated: '2024-06-07'
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
    currentTitle: 'Investment Banking VP',
    currentCompany: 'Goldman Sachs',
    industry: 'Financial Services',
    location: 'New York, NY',
    about: 'Investment banking professional specializing in technology M&A transactions. Advised on over $5B in deal value across 20+ transactions. Strong background in financial modeling and client relationship management.',
    aiSummary: 'Senior investment banker with deep tech sector expertise and extensive M&A transaction experience.',
    education: [
      {
        school: 'Wharton School',
        degree: 'MBA',
        field: 'Finance',
        startYear: 2019,
        endYear: 2021
      },
      {
        school: 'Yale University',
        degree: 'BA',
        field: 'Economics',
        startYear: 2015,
        endYear: 2019
      }
    ],
    experience: [
      {
        title: 'Vice President',
        company: 'Goldman Sachs',
        location: 'New York, NY',
        startDate: '2023-01',
        endDate: 'Present',
        description: 'Leading M&A execution for technology clients, managing deal teams and client relationships.',
        isCurrent: true
      },
      {
        title: 'Associate',
        company: 'Goldman Sachs',
        location: 'New York, NY',
        startDate: '2021-07',
        endDate: '2022-12',
        description: 'Executed M&A transactions in technology sector, built financial models and pitch materials.',
        isCurrent: false
      },
      {
        title: 'Investment Banking Analyst',
        company: 'JP Morgan',
        location: 'New York, NY',
        startDate: '2019-07',
        endDate: '2021-06',
        description: 'Analyst in TMT group, supported execution of IPOs and M&A transactions.',
        isCurrent: false
      }
    ],
    lastUpdated: '2024-06-05'
  },
  {
    id: '3',
    name: 'Emily Watson',
    linkedinUrl: 'https://linkedin.com/in/emilywatson',
    currentTitle: 'Marketing Director',
    currentCompany: 'Salesforce',
    industry: 'Technology',
    location: 'Austin, TX',
    about: 'Growth marketing leader with expertise in B2B SaaS marketing, demand generation, and customer acquisition. Led marketing teams that generated 200%+ pipeline growth and improved customer LTV.',
    aiSummary: 'Results-driven marketing executive specializing in B2B SaaS growth and demand generation with proven ROI track record.',
    education: [
      {
        school: 'Northwestern Kellogg',
        degree: 'MBA',
        field: 'Marketing',
        startYear: 2020,
        endYear: 2022
      },
      {
        school: 'University of Texas',
        degree: 'BBA',
        field: 'Marketing',
        startYear: 2016,
        endYear: 2020
      }
    ],
    experience: [
      {
        title: 'Marketing Director',
        company: 'Salesforce',
        location: 'Austin, TX',
        startDate: '2023-03',
        endDate: 'Present',
        description: 'Leading demand generation for SMB segment, managing $10M+ marketing budget.',
        isCurrent: true
      },
      {
        title: 'Senior Marketing Manager',
        company: 'HubSpot',
        location: 'Boston, MA',
        startDate: '2022-08',
        endDate: '2023-02',
        description: 'Owned customer acquisition campaigns, improved conversion rates by 25%.',
        isCurrent: false
      },
      {
        title: 'Marketing Manager',
        company: 'Zendesk',
        location: 'San Francisco, CA',
        startDate: '2020-06',
        endDate: '2022-07',
        description: 'Managed product marketing for customer service solutions.',
        isCurrent: false
      }
    ],
    lastUpdated: '2024-06-08'
  },
  {
    id: '4',
    name: 'David Kim',
    linkedinUrl: 'https://linkedin.com/in/davidkim',
    currentTitle: 'Founder & CEO',
    currentCompany: 'TechStart Inc.',
    industry: 'Technology',
    location: 'Seattle, WA',
    about: 'Serial entrepreneur with 2 successful exits. Currently building AI-powered software for healthcare. Passionate about using technology to solve real-world problems and creating positive impact.',
    aiSummary: 'Experienced entrepreneur and CEO with multiple exits, currently focused on AI applications in healthcare technology.',
    education: [
      {
        school: 'MIT Sloan',
        degree: 'MBA',
        field: 'Entrepreneurship',
        startYear: 2017,
        endYear: 2019
      },
      {
        school: 'Carnegie Mellon',
        degree: 'MS',
        field: 'Computer Science',
        startYear: 2015,
        endYear: 2017
      }
    ],
    experience: [
      {
        title: 'Founder & CEO',
        company: 'TechStart Inc.',
        location: 'Seattle, WA',
        startDate: '2022-01',
        endDate: 'Present',
        description: 'Building AI-powered healthcare software, raised $5M Series A.',
        isCurrent: true
      },
      {
        title: 'Co-Founder & CTO',
        company: 'DataFlow Solutions',
        location: 'San Francisco, CA',
        startDate: '2019-08',
        endDate: '2021-11',
        description: 'Built data analytics platform, acquired by Snowflake for $50M.',
        isCurrent: false
      },
      {
        title: 'Senior Software Engineer',
        company: 'Microsoft',
        location: 'Redmond, WA',
        startDate: '2017-06',
        endDate: '2019-07',
        description: 'Worked on Azure ML platform, led team of 8 engineers.',
        isCurrent: false
      }
    ],
    lastUpdated: '2024-06-06'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    linkedinUrl: 'https://linkedin.com/in/lisathompson',
    currentTitle: 'Management Consultant',
    currentCompany: 'McKinsey & Company',
    industry: 'Consulting',
    location: 'Chicago, IL',
    about: 'Strategy consultant focused on digital transformation and operational excellence for Fortune 500 companies. Expertise in healthcare, retail, and financial services sectors.',
    aiSummary: 'Senior strategy consultant specializing in digital transformation with extensive experience across healthcare, retail, and financial services.',
    education: [
      {
        school: 'Harvard Business School',
        degree: 'MBA',
        field: 'Strategy',
        startYear: 2021,
        endYear: 2023
      },
      {
        school: 'Duke University',
        degree: 'BS',
        field: 'Economics',
        startYear: 2017,
        endYear: 2021
      }
    ],
    experience: [
      {
        title: 'Management Consultant',
        company: 'McKinsey & Company',
        location: 'Chicago, IL',
        startDate: '2023-08',
        endDate: 'Present',
        description: 'Leading digital transformation engagements for healthcare and retail clients.',
        isCurrent: true
      },
      {
        title: 'Business Analyst',
        company: 'Bain & Company',
        location: 'Boston, MA',
        startDate: '2021-07',
        endDate: '2023-07',
        description: 'Supported strategy projects for financial services and technology clients.',
        isCurrent: false
      }
    ],
    lastUpdated: '2024-06-04'
  }
];
