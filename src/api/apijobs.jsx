import supabaseClient from '@/utils/supabase';

// Cache constants
const CACHE_KEY = 'external_jobs_cache';
const CACHE_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

// RapidAPI Jobs API Integration
class UnifiedJobsAPI {
  constructor() {
    this.apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    this.baseUrl = 'https://jsearch.p.rapidapi.com';
    this.headers = {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    };
    this.lastRequestTime = 0;
    this.requestDelay = 3600000 / 1000; // 3.6 seconds between requests
    this.dailyRequestCount = 0;
    this.dailyRequestReset = new Date().setHours(0,0,0,0);
    this.defaultLocation = 'Kenya'; // Set default location to Kenya
    
    // Clean up expired cache on initialization
    this.cleanupCache();
  }

  // Cache management methods
  getCachedJobs(key) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const cacheItem = cache[key];
      
      if (cacheItem && Date.now() < cacheItem.expiry) {
        console.log('Cache hit for:', key);
        return cacheItem.data;
      }
      
      // Remove expired item if found
      if (cacheItem) {
        delete cache[key];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        console.log('Removed expired cache for:', key);
      }
      
      return null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  setCachedJobs(key, data) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache[key] = {
        data,
        expiry: Date.now() + CACHE_DURATION,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      console.log('Cached data for:', key);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  cleanupCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const now = Date.now();
      let cleaned = false;
      
      Object.keys(cache).forEach(key => {
        if (now >= cache[key].expiry) {
          delete cache[key];
          cleaned = true;
          console.log('Cleaned up expired cache for:', key);
        }
      });
      
      if (cleaned) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  // Enhanced rate limiting
  async rateLimitRequest() {
    const now = Date.now();

    // Check daily limit
    if (now > this.dailyRequestReset) {
      // Reset daily counter at midnight
      this.dailyRequestCount = 0;
      this.dailyRequestReset = new Date().setHours(24,0,0,0);
    }

    if (this.dailyRequestCount >= 30) {
      console.log('Daily request limit reached');
      throw new Error('Daily API limit reached');
    }

    // Check hourly rate limit
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.requestDelay - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = now;
    this.dailyRequestCount++;

    // Log remaining requests
    console.log(`API Requests - Daily: ${30 - this.dailyRequestCount} remaining`);
  }

  async searchJobs(query, location = 'Kenya', options = {}) {
    try {
      // Always use Kenya as location if not specified
      const searchLocation = location || this.defaultLocation;
      const cacheKey = `jsearch_${query}_${searchLocation}_${JSON.stringify(options)}`;
      
      // Check cache first
      const cachedData = this.getCachedJobs(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      await this.rateLimitRequest();

      const searchParams = new URLSearchParams({
        query: `${query} in ${searchLocation}`,
        page: '1',
        num_pages: '1',
        date_posted: options.datePosted || 'all'
      });

      const response = await fetch(`${this.baseUrl}/search?${searchParams}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`JSearch API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter for Kenyan jobs only
      const formattedJobs = data.data
        .filter(job => 
          job.job_country?.toLowerCase() === 'kenya' ||
          job.job_city?.toLowerCase().includes('nairobi') ||
          job.job_city?.toLowerCase().includes('mombasa') ||
          job.job_city?.toLowerCase().includes('kisumu')
        )
        .map(job => ({
          id: `jsearch_${job.job_id}`,
          title: job.job_title,
          description: job.job_description,
          location: `${job.job_city || 'Kenya'}, Kenya`,
          company_name: job.employer_name,
          company_logo: job.employer_logo,
          salary_range: this.formatSalary(job.job_min_salary, job.job_max_salary, 'KES'),
          job_type: job.job_employment_type,
          source: 'JSearch',
          url: job.job_apply_link,
          created_at: job.job_posted_at_datetime || new Date().toISOString(),
          is_external: true,
          requirements: job.job_required_skills?.join(', '),
          benefits: job.job_highlights?.Benefits?.join(', '),
          experience_level: job.job_experience_level
        }));

      // Cache the filtered results
      this.setCachedJobs(cacheKey, formattedJobs);
      console.log(`Found ${formattedJobs.length} jobs in Kenya`);
      
      return formattedJobs;
    } catch (error) {
      console.error('Error searching jobs:', error);
      return [];
    }
  }

  async getJobDetails(jobId) {
    try {
      await this.rateLimitRequest();

      const searchParams = new URLSearchParams({
        job_id: jobId,
        extended_publisher_details: 'false'
      });

      const response = await fetch(`${this.baseUrl}/job-details?${searchParams}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`JSearch API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0];
    } catch (error) {
      console.error('Error getting job details:', error);
      return null;
    }
  }

  async getEstimatedSalary(jobTitle, location) {
    try {
      await this.rateLimitRequest();

      const searchParams = new URLSearchParams({
        job_title: jobTitle,
        location: location,
        radius: '100'
      });

      const response = await fetch(`${this.baseUrl}/estimated-salary?${searchParams}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`JSearch API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting salary estimate:', error);
      return null;
    }
  }

  formatSalary(min, max, currency = 'USD') {
    if (!min && !max) return 'Salary not specified';
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} per year`;
    }
    if (min) return `${currency} ${min.toLocaleString()}+ per year`;
    return `Up to ${currency} ${max.toLocaleString()} per year`;
  }

  // ... [Keep all the UnifiedJobsAPI methods you provided]

  async fetchJobList(query, location, options = {}) {
    try {
      console.log('Fetching from Jobs API with:', { query, location, options });
      
      const response = await fetch(`${this.baseUrl}/list`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        params: {
          query: query || '',
          location: location || 'US',
          distance: '100',
          language: 'en_GB',
          remoteOnly: options.remoteOnly || false,
          datePosted: 'month',
          employmentTypes: options.employmentTypes || 'fulltime;parttime',
          index: '0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jobs API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return []; // Return empty array instead of throwing
      }

      const data = await response.json();
      console.log('Jobs API Response:', data);
      
      return data.jobs?.map(job => ({
        id: `jobs_${job.id || Math.random().toString(36).substr(2, 9)}`,
        title: job.title || 'Untitled Position',
        description: job.description || 'No description available',
        location: job.location || 'Location not specified',
        company_name: job.company || 'Unknown Company',
        company_logo: job.company_logo || '/default-company-logo.svg',
        salary_range: job.salary || 'Not specified',
        job_type: job.type || 'Full-time',
        source: 'Jobs API',
        url: job.url || '#',
        created_at: job.posted_at || new Date().toISOString(),
        is_external: true
      })) || [];
    } catch (error) {
      console.error('Error in fetchJobList:', error);
      return []; // Return empty array on error
    }
  }
}

const jobsApi = new UnifiedJobsAPI();

// Supabase Job Functions
export const addNewJob = async (jobData, userId, token) => {
  try {
    console.log('Received job data:', jobData);

    if (!jobData || !jobData.title) {
      throw new Error('Job title is required');
    }

    const supabase = await supabaseClient(token);
    
    // Generate a unique job ID
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const jobId = `job_${timestamp}_${randomString}`;

    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        id: jobId,
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        company_id: jobData.company_id,
        requirements: jobData.requirements,
        application_deadline: jobData.application_deadline,
        application_requirements: jobData.application_requirements,
        recruiter_id: userId,
        is_open: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

export const getSingleJob = async (jobId) => {
  try {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        company:company_id (*),
        applications (*)
      `)
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching job:', error);
    throw error;
  }
};

export const getJobs = async (filters = {}, token) => {
  try {
    console.log('Getting jobs with filters:', filters);
    
    // Get local jobs
    const supabase = await supabaseClient(token);
    let query = supabase
      .from('jobs')
      .select(`
        *,
        company:company_id (*),
        applications (*)
      `)
      .order('created_at', { ascending: false });

    // Always filter for Kenyan jobs
    query = query.ilike('location', '%Kenya%');

    if (filters.searchQuery) {
      query = query.ilike('title', `%${filters.searchQuery}%`);
    }

    const { data: localJobs, error } = await query;
    if (error) throw error;

    console.log('Local jobs found:', localJobs.length);

    // Get external jobs from Kenya
    try {
      const externalJobs = await jobsApi.searchJobs(
        filters.searchQuery || '',
        'Kenya',
        {
          datePosted: 'all',
          remoteOnly: filters.remoteOnly || false
        }
      );

      if (externalJobs?.length > 0) {
        console.log('External Kenyan jobs found:', externalJobs.length);
        return {
          jobs: [...localJobs, ...externalJobs],
          externalJobsStatus: 'success'
        };
      }
    } catch (error) {
      console.error('Error fetching external jobs:', error);
      return {
        jobs: localJobs,
        externalJobsStatus: error.message?.includes('not subscribed') 
          ? 'subscription_required' 
          : 'error'
      };
    }

    return {
      jobs: localJobs,
      externalJobsStatus: 'no_results'
    };
  } catch (error) {
    console.error('Error in getJobs:', error);
    throw error;
  }
};

export const getMyJobs = async (userId) => {
  try {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        company:company_id (*),
        applications (*)
      `)
      .eq('recruiter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching recruiter jobs:', error);
    throw error;
  }
};

export const updateHiringStatus = async (jobId, isOpen) => {
  try {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('jobs')
      .update({ is_open: isOpen })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating hiring status:', error);
    throw error;
  }
};

export const toggleSaveJob = async (jobId, userId, token) => {
  try {
    const supabase = await supabaseClient(token);

    // First, check if the job is already saved
    const { data: existingSave, error: checkError } = await supabase
      .from('saved_jobs')
      .select()
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw checkError;
    }

    if (existingSave) {
      // If job is already saved, remove it
      const { error: deleteError } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('job_id', jobId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      return { saved: false };
    } else {
      // If job is not saved, save it
      const { error: insertError } = await supabase
        .from('saved_jobs')
        .insert([{
          job_id: jobId,
          user_id: userId,
          saved_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;
      return { saved: true };
    }
  } catch (error) {
    console.error('Error toggling save job:', error);
    throw error;
  }
};

// Add function to check if a job is saved
export const isJobSaved = async (jobId, userId) => {
  try {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('saved_jobs')
      .select()
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking saved job:', error);
    throw error;
  }
};

// Add function to get user's saved jobs
export const getSavedJobs = async (userId) => {
  try {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('saved_jobs')
      .select(`
        *,
        job:job_id (
          *,
          company:company_id (*)
        )
      `)
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    throw error;
  }
};

export const deleteJob = async (jobId, token) => {
  try {
    const supabase = await supabaseClient(token);

    // First delete all applications for this job
    const { error: applicationsError } = await supabase
      .from('applications')
      .delete()
      .eq('job_id', jobId);

    if (applicationsError) throw applicationsError;

    // Then delete all saved instances of this job
    const { error: savedJobsError } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId);

    if (savedJobsError) throw savedJobsError;

    // Finally delete the job itself
    const { error: jobError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (jobError) throw jobError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

export const editJob = async (jobId, jobData, token) => {
  try {
    const supabase = await supabaseClient(token);

    if (!jobData || !jobData.title) {
      throw new Error('Job title is required');
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        company_id: jobData.company_id,
        requirements: jobData.requirements,
        application_deadline: jobData.application_deadline,
        application_requirements: jobData.application_requirements,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select(`
        *,
        company:company_id (*),
        applications (*)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
};
