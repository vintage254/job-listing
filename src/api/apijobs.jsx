import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// API Configuration
const ADZUNA_CONFIG = {
  baseURL: 'https://api.adzuna.com/v1/api/jobs/gb/search/1',
  appId: 'b547d456',
  apiKey: 'fad163f42e2ea4acc6aa6d63bd2792a2'
};

const FINDWORK_CONFIG = {
  baseURL: '/findwork',
  apiKey: '11f6c5539b1d332119794b0edc21108c38101c60'
};

const REED_CONFIG = {
  baseURL: '/reed',
  apiKey: '3418b912-4e3d-4eae-8300-da8575316ff6'
};

const ARBEITNOW_CONFIG = {
  baseURL: 'https://www.arbeitnow.com/api/job-board-api'
};

// Cache configuration - 72 hours
const CACHE_DURATION = 72 * 60 * 60 * 1000;

// Simple rate limiting using localStorage
const RATE_LIMIT = {
  maxRequests: 100,
  timeWindow: 15 * 60 * 1000, // 15 minutes
  key: 'api_request_count'
};

const checkRateLimit = () => {
  const now = Date.now();
  const requestHistory = JSON.parse(localStorage.getItem(RATE_LIMIT.key) || '{"count": 0, "timestamp": 0}');
  
  if (now - requestHistory.timestamp > RATE_LIMIT.timeWindow) {
    // Reset if time window has passed
    localStorage.setItem(RATE_LIMIT.key, JSON.stringify({ count: 1, timestamp: now }));
    return true;
  }
  
  if (requestHistory.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  // Increment count
  localStorage.setItem(RATE_LIMIT.key, JSON.stringify({
    count: requestHistory.count + 1,
    timestamp: requestHistory.timestamp
  }));
  return true;
};

// Add language detection helper
const isEnglishText = (text) => {
  // Simple check for common English characters and words
  const englishPattern = /^[a-zA-Z0-9\s.,!?'"-]+$/;
  const commonEnglishWords = ['the', 'and', 'or', 'in', 'at', 'job', 'work', 'experience'];
  
  // Check if text contains common English words and matches English pattern
  return englishPattern.test(text) || 
         commonEnglishWords.some(word => text.toLowerCase().includes(word));
};

// Add HTML to text converter helper
const htmlToText = (html) => {
  if (!html) return '';
  
  // Create a temporary element
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Replace common HTML entities
  let text = temp.textContent || temp.innerText;
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n') // Remove extra newlines
    .replace(/\s+/g, ' ') // Remove extra spaces
    .trim();

  return text;
};

// Update normalizeId function to handle special characters better
const normalizeId = (source, id) => {
  // Remove special characters and spaces, keeping only alphanumeric characters and hyphens
  const cleanId = (id || '').toString()
    .replace(/[^a-zA-Z0-9-]/g, '_')
    .toLowerCase();
  
  // Add source prefix if not already present
  const prefix = source.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  
  // Ensure the ID is URL-safe
  return encodeURIComponent(`${prefix}_${cleanId}`);
};

// Update normalizeJobData function
const normalizeJobData = (job, source) => {
  // Skip jobs without English titles or descriptions
  if (!isEnglishText(job.title) || !isEnglishText(job.description)) {
    return null;
  }

  // Clean up description
  let cleanDescription = '';
  try {
    if (typeof job.description === 'string') {
      cleanDescription = htmlToText(job.description);
    } else if (typeof job.description === 'object') {
      cleanDescription = JSON.stringify(job.description);
    }
  } catch (error) {
    console.error('Error processing description:', error);
    cleanDescription = 'Description not available';
  }

  // Generate normalized ID
  const normalizedId = normalizeId(source, job.id || Math.random().toString(36).substr(2, 9));

  return {
    id: normalizedId,
    title: job.title,
    company_name: job.company?.name || job.company_name || 'Unknown Company',
    company_logo: job.company?.logo_url || job.company?.logo || job.company_logo,
    location: job.location?.display_name || job.location || 'Location not specified',
    salary_range: job.salary_min && job.salary_max ? 
      `KES ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} per month` : 
      'Salary not specified',
    job_type: job.contract_type || job.job_type || 'Not specified',
    description: cleanDescription,
    requirements: Array.isArray(job.requirements) ? job.requirements : [],
    responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
    source: source,
    external_url: job.redirect_url || job.url || '',
    created_at: new Date().toISOString()
  };
};

// Function to fetch jobs from Adzuna
const fetchAdzunaJobs = async (query = '') => {
  try {
    const response = await axios.get(`${ADZUNA_CONFIG.baseURL}`, {
      params: {
        app_id: ADZUNA_CONFIG.appId,
        app_key: ADZUNA_CONFIG.apiKey,
        what: query,
        where: 'kenya',
        'content-type': 'application/json'
      }
    });
    return response.data.results.map(job => normalizeJobData(job, 'adzuna'));
  } catch (error) {
    console.error('Adzuna API Error:', error);
    return [];
  }
};

// Add API_CONFIG at the top with other configurations
const API_CONFIG = {
  PROXY_URL: 'http://localhost:3001/api',
  FINDWORK_CONFIG: {
    baseURL: '/findwork',
  },
  REED_CONFIG: {
    baseURL: '/reed',
  }
};

// Update FindWork API call
const fetchFindWorkJobs = async (query = '') => {
  try {
    const response = await axios.get(`${API_CONFIG.PROXY_URL}${API_CONFIG.FINDWORK_CONFIG.baseURL}`, {
      params: {
        search: query,
        location: 'kenya'
      }
    });
    return response.data.results.map(job => normalizeJobData(job, 'findwork'));
  } catch (error) {
    console.error('FindWork API Error:', error);
    return [];
  }
};

// Update Reed API call
const fetchReedJobs = async (query = '') => {
  try {
    const response = await axios.get(`${API_CONFIG.PROXY_URL}${API_CONFIG.REED_CONFIG.baseURL}`, {
      params: {
        keywords: query,
        locationName: 'kenya'
      }
    });
    return response.data.results.map(job => normalizeJobData(job, 'reed'));
  } catch (error) {
    console.error('Reed API Error:', error);
    return [];
  }
};

// Update fetchArbeitnowJobs function to remove Africa location filter
const fetchArbeitnowJobs = async () => {
  try {
    const response = await axios.get(ARBEITNOW_CONFIG.baseURL);
    
    // Map and normalize all jobs without location filtering
    return response.data.data
      .map(job => normalizeJobData(job, 'arbeitnow'))
      .filter(job => job !== null); // Remove any null results from normalization

  } catch (error) {
    console.error('Arbeitnow API Error:', error);
    return [];
  }
};

// Enhanced caching function
const getCachedData = async (key) => {
  const { data, error } = await supabase
    .from('cache')
    .select('*')
    .eq('key', key)
    .single();

  if (error) return null;

  if (data && Date.now() - new Date(data.created_at).getTime() < CACHE_DURATION) {
    return JSON.parse(data.value);
  }

  return null;
};

const setCachedData = async (key, value) => {
  const { error } = await supabase
    .from('cache')
    .upsert({
      key,
      value: JSON.stringify(value),
      created_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    });

  if (error) console.error('Caching error:', error);
};

// Modify fetchAllJobs to use enhanced caching
export const fetchAllJobs = async (query = '') => {
  try {
    const cacheKey = `jobs_${query}`;
    const cachedData = await getCachedData(cacheKey);

    if (cachedData) {
      console.log('Returning cached jobs data');
      return cachedData;
    }

    // Fetch new jobs from all sources
    const [adzunaJobs, findworkJobs, reedJobs, arbeitnowJobs] = await Promise.all([
      fetchAdzunaJobs(query),
      fetchFindWorkJobs(query),
      fetchReedJobs(query),
      fetchArbeitnowJobs()
    ]);

    // Combine all jobs
    const allJobs = [...adzunaJobs, ...findworkJobs, ...reedJobs, ...arbeitnowJobs];

    // Store in cache
    await setCachedData(cacheKey, allJobs);

    // Store in Supabase jobs table
    if (allJobs.length > 0) {
      const { error } = await supabase
        .from('jobs')
        .upsert(allJobs, { onConflict: 'id' });

      if (error) {
        console.error('Error storing jobs:', error);
      }

      await notifyNewJobs(allJobs.length);
    }

    return allJobs;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

// Modify searchJobs to use caching
export const searchJobs = async (query) => {
  try {
    const cacheKey = `search_${query}`;
    const cachedResults = await getCachedData(cacheKey);

    if (cachedResults) {
      console.log('Returning cached search results');
      return cachedResults;
    }

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let results = jobs;
    if (jobs.length === 0) {
      results = await fetchAllJobs(query);
    }

    await setCachedData(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
};

// Webhook notification function
const notifyNewJobs = async (jobCount) => {
  try {
    // Implement your webhook notification logic here
    // Example: Send notification to a Slack channel or email
    console.log(`${jobCount} new jobs have been added to the database`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Export other useful functions
export const getJobById = async (id) => {
  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return job;
  } catch (error) {
    console.error('Error fetching job:', error);
    throw error;
  }
};

// Enhanced job fetching function
export const getJobs = async ({ location, company_id, searchQuery }) => {
  try {
    let query = supabase
      .from("jobs")
      .select(`
        *,
        saved_jobs (
          user_id
        )
      `);

    if (location) {
      query = query.eq("location", location);
    }

    if (company_id) {
      query = query.eq("company_id", company_id);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data: localJobs, error } = await query;

    if (error) throw error;

    // Fetch external jobs if needed
    const externalJobs = await fetchExternalJobs(searchQuery);

    // Combine local and external jobs
    const allJobs = [...(localJobs || []), ...externalJobs];

    return allJobs;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};

// Add this helper function to check if a job exists
export const checkJobExists = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking job:", error);
    return false;
  }
};

// Get saved jobs
export const getSavedJobs = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("saved_jobs")
      .select(`
        *,
        job:jobs!inner (
          *,
          company:companies (
            name,
            logo_url
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    throw error;
  }
};

// Get single job
export const getSingleJob = async (jobId) => {
  try {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    // Ensure jobId is a string and handle potential objects
    const jobIdString = typeof jobId === 'object' ? 
      jobId.job_id?.toString() : 
      jobId.toString();

    console.log('Fetching job with ID:', jobIdString);

    if (!jobIdString) {
      throw new Error('Invalid job ID format');
    }

    // First try to get the job from our database
    const { data: localJob, error: localError } = await supabase
      .from("jobs")
      .select(`
        *,
        companies (name, logo_url),
        applications (*)
      `)
      .eq('id', jobIdString)
      .maybeSingle();

    if (localJob) {
      console.log('Found job in local database:', localJob);
      return localJob;
    }

    // Try to determine the source from the job ID
    let source = null;
    let originalId = jobIdString;

    // Check for known source patterns
    if (jobIdString.includes('arbeitnow_')) {
      source = 'arbeitnow';
      originalId = jobIdString.replace('arbeitnow_', '');
    } else if (jobIdString.includes('adzuna_')) {
      source = 'adzuna';
      originalId = jobIdString.replace('adzuna_', '');
    } else if (jobIdString.includes('findwork_')) {
      source = 'findwork';
      originalId = jobIdString.replace('findwork_', '');
    } else if (jobIdString.includes('reed_')) {
      source = 'reed';
      originalId = jobIdString.replace('reed_', '');
    }

    console.log('Determined source:', source, 'originalId:', originalId);
    
    // Fetch from appropriate external source
    let externalJob = null;
    if (source) {
      switch(source.toLowerCase()) {
        case 'adzuna':
          const adzunaJobs = await fetchAdzunaJobs(originalId);
          externalJob = adzunaJobs?.[0];
          break;
        case 'findwork':
          const findworkJobs = await fetchFindWorkJobs(originalId);
          externalJob = findworkJobs?.[0];
          break;
        case 'reed':
          const reedJobs = await fetchReedJobs(originalId);
          externalJob = reedJobs?.[0];
          break;
        case 'arbeitnow':
          const arbeitnowJobs = await fetchArbeitnowJobs();
          externalJob = arbeitnowJobs?.find(job => 
            job.id === originalId || 
            job.id.includes(originalId)
          );
          break;
      }
    }

    // If no source was determined or job wasn't found, try all sources
    if (!externalJob) {
      console.log('Job not found in primary source, trying all sources...');
      const allJobs = await fetchExternalJobs();
      externalJob = allJobs.find(job => 
        job.id === originalId || 
        job.id.includes(originalId) ||
        job.id === jobIdString ||
        job.id.includes(jobIdString)
      );
    }

    if (!externalJob) {
      console.log('Job not found in any source');
      throw new Error(`Job not found with ID: ${jobIdString}`);
    }

    console.log('Found external job:', externalJob);

    // Normalize the external job data
    const normalizedJob = normalizeJobData(externalJob, source || 'external');
    
    // Store the job in our database for future reference
    if (normalizedJob) {
      const { error: insertError } = await supabase
        .from("jobs")
        .insert([normalizedJob])
        .single();

      if (insertError) {
        console.error('Error storing external job:', insertError);
      }
    }

    return normalizedJob;

  } catch (error) {
    console.error("Error fetching job:", error);
    throw error;
  }
};

// Save/unsave job
export const toggleSaveJob = async (userId, jobId, alreadySaved, jobData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!jobData) {
      throw new Error('Job data is required');
    }

    // Use the same ID normalization
    const normalizedJobId = normalizeId(jobData.source || 'external', jobId);

    if (alreadySaved) {
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq('user_id', userId.toString())
        .eq('job_id', normalizedJobId);

      if (error) throw error;
      return null;
    } else {
      // First, check if job exists in jobs table using the normalized ID
      const { data: existingJob } = await supabase
        .from("jobs")
        .select("id")
        .eq('id', normalizedJobId)
        .maybeSingle();

      // If job doesn't exist, create it first
      if (!existingJob) {
        const { error: insertError } = await supabase
          .from("jobs")
          .insert([{
            id: normalizedJobId,
            title: jobData.title || 'No Title',
            company_name: jobData.company_name || 'Unknown Company',
            company_logo: jobData.company_logo,
            location: jobData.location || 'Location not specified',
            description: jobData.description || '',
            salary_range: jobData.salary_range || 'Not specified',
            job_type: jobData.job_type || 'Not specified',
            external_id: jobId,
            source: jobData.source || 'external',
            created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      // Now save the job
      const { data, error } = await supabase
        .from("saved_jobs")
        .insert([{ 
          user_id: userId.toString(), 
          job_id: normalizedJobId,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error toggling job save:", error);
    throw new Error(error.message || 'Failed to save/unsave job');
  }
};

// Update hiring status
export const updateHiringStatus = async (jobId, isOpen, recruiterId) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .update({ isOpen })
      .eq('id', jobId)
      .eq('recruiter_id', recruiterId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating hiring status:", error);
    throw error;
  }
};

// Get recruiter's jobs
export const getMyJobs = async (recruiterId) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        companies (name, logo_url)
      `)
      .eq('recruiter_id', recruiterId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching recruiter jobs:", error);
    throw error;
  }
};

// Delete job
export const deleteJob = async (jobId, recruiterId) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .delete()
      .eq('id', jobId)
      .eq('recruiter_id', recruiterId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
};

// Add new job
export const addNewJob = async (jobData) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .insert([jobData])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
};

// Update fetchExternalJobs function
const fetchExternalJobs = async (query = '') => {
  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded for external API calls');
    return [];
  }

  const [adzunaJobs, findworkJobs, reedJobs, arbeitnowJobs] = await Promise.all([
    fetchAdzunaJobs(query),
    fetchFindWorkJobs(query),
    fetchReedJobs(query),
    fetchArbeitnowJobs()
  ]);

  // Filter out null jobs (non-English or invalid)
  const validJobs = [...adzunaJobs, ...findworkJobs, ...reedJobs, ...arbeitnowJobs]
    .filter(job => job !== null);

  return validJobs;
};

// Add cache table creation SQL
/*
CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cache_created_at ON cache(created_at);
*/

// Add cache cleanup function
export const cleanupCache = async () => {
  try {
    const { error } = await supabase
      .from('cache')
      .delete()
      .lt('created_at', new Date(Date.now() - CACHE_DURATION).toISOString());

    if (error) throw error;
  } catch (error) {
    console.error('Error cleaning cache:', error);
  }
};

// Schedule cache cleanup
setInterval(cleanupCache, 24 * 60 * 60 * 1000); // Run once per day
