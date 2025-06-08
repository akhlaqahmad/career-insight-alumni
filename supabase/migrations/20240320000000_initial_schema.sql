-- Create enum for scraping status
CREATE TYPE scraping_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Create scraping_jobs table
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    total_profiles INTEGER NOT NULL DEFAULT 0,
    processed_profiles INTEGER NOT NULL DEFAULT 0,
    successful_profiles INTEGER NOT NULL DEFAULT 0,
    failed_profiles INTEGER NOT NULL DEFAULT 0,
    status scraping_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ,
    user_id UUID
);

-- Create scraping_queue table
CREATE TABLE IF NOT EXISTS scraping_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scraping_job_id UUID REFERENCES scraping_jobs(id) ON DELETE CASCADE,
    linkedin_url TEXT NOT NULL,
    name TEXT,
    status scraping_status NOT NULL DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    scraped_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    priority INTEGER DEFAULT 0
);

-- Create alumni_profiles table
CREATE TABLE IF NOT EXISTS alumni_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    linkedin_url TEXT UNIQUE NOT NULL,
    current_title TEXT,
    current_company TEXT,
    industry TEXT,
    location TEXT,
    about TEXT,
    profile_picture_url TEXT,
    ai_summary TEXT,
    skills TEXT[],
    experience JSONB,
    education JSONB,
    raw_data JSONB,
    scraping_job_id UUID REFERENCES scraping_jobs(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    scraped_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_queue_job_status ON scraping_queue(scraping_job_id, status);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_linkedin_url ON alumni_profiles(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_company ON alumni_profiles(current_company);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_industry ON alumni_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_location ON alumni_profiles(location);

-- Enable Row Level Security (RLS)
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON scraping_jobs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON scraping_queue FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON alumni_profiles FOR SELECT USING (true);

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_updated
CREATE TRIGGER update_alumni_profiles_last_updated
    BEFORE UPDATE ON alumni_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated(); 