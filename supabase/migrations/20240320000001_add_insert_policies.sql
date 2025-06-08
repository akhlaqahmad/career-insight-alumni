-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON scraping_jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON scraping_queue;
DROP POLICY IF EXISTS "Enable read access for all users" ON alumni_profiles;

-- Create policies for scraping_jobs
CREATE POLICY "Enable read access for all users" ON scraping_jobs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON scraping_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON scraping_jobs FOR UPDATE USING (true);

-- Create policies for scraping_queue
CREATE POLICY "Enable read access for all users" ON scraping_queue FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON scraping_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON scraping_queue FOR UPDATE USING (true);

-- Create policies for alumni_profiles
CREATE POLICY "Enable read access for all users" ON alumni_profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON alumni_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON alumni_profiles FOR UPDATE USING (true); 