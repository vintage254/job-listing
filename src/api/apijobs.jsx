import supabase, { setSupabaseToken, clearSupabaseSession } from '@/lib/supabase';
import axios from 'axios';

// Constants
const CACHE_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

class UnifiedJobsAPI {
  constructor() {
    this.apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    this.jsearchHost = 'jsearch.p.rapidapi.com';
    this.dailyLimit = 30;
    this.hourlyLimit = 1000;
    this.usedToday = 0;
    this.usedThisHour = 0;
    this.lastReset = new Date().setHours(0,0,0,0);
    this.hourReset = new Date().setMinutes(0,0,0);
    this.lastRequestTime = 0;
    this.minRequestInterval = 3600 / this.hourlyLimit * 1000;
    this.supabase = supabase;

    this.apiStatus = {
      jsearch: { available: true },
      jobsSearch: { available: true },
      apiJob: { available: true },
      jobPostings: { available: true }
    };
  }

  // Auth Methods
  async ensureAuth(token) {
    if (!token) {
      return false;
    }

    try {
      const success = await setSupabaseToken(token);
      if (!success) {
        console.warn('Failed to set Supabase session');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Auth error:', error);
      return false;
    }
  }

  // Cache Methods
  async getCachedJobs(key, token) {
    try {
      const isAuthed = await this.ensureAuth(token);
      if (!isAuthed) {
        console.log('No auth, skipping cache check');
        return null;
      }

      const now = new Date().toISOString();
      const { data, error } = await this.supabase
        .from('cached_jobs')
        .select('job_data')
        .eq('query_key', key)
        .gt('expires_at', now)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data?.job_data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  async setCachedJobs(key, data, token) {
    try {
      if (!await this.ensureAuth(token)) return;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_DURATION);

      const { error } = await this.supabase
        .from('cached_jobs')
        .upsert({
          query_key: key,
          job_data: data,
          cached_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async cleanupCache(token) {
    try {
      const isAuthed = await this.ensureAuth(token);
      if (!isAuthed) {
        console.log('No auth, skipping cache cleanup');
        return;
      }

      const now = new Date().toISOString();
      const { error } = await this.supabase
        .from('cached_jobs')
        .delete()
        .lt('expires_at', now);

      if (error) throw error;
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  // Search Methods
  async searchJobs(query, location = 'Kenya', options = {}) {
    try {
      const cacheKey = `jobs_${query}_${location}_${options.page || 1}`;
      let cachedData = null;
      
      // Only try cache if we have a token
      if (options.token) {
        try {
          cachedData = await this.getCachedJobs(cacheKey, options.token);
          if (cachedData) return { ...cachedData, source: 'cache' };
        } catch (error) {
          console.warn('Cache access failed:', error);
        }
      }

      // Fetch fresh data
      const apiResult = await this.fetchJobList(query, location, options);
      
      // Only try to cache if we have a token
      if (options.token && apiResult.length > 0) {
        try {
          await this.setCachedJobs(cacheKey, {
            jobs: apiResult,
            total: apiResult.length
          }, options.token);
        } catch (error) {
          console.warn('Failed to cache results:', error);
        }
      }

      return {
        jobs: apiResult,
        total: apiResult.length,
        source: 'api'
      };
    } catch (error) {
      console.error('Error in searchJobs:', error);
      return { jobs: [], total: 0, source: 'api' };
    }
  }

  // Add getJobs method to the class
  async getJobs(filters = {}, token = null) {
    try {
      console.log('Getting jobs with filters:', filters);

      const result = await this.searchJobs(
        filters.searchQuery || '',
        filters.location || 'Kenya',
        {
          datePosted: 'all',
          remoteOnly: filters.remoteOnly || false,
          page: filters.page || 1,
          limit: filters.limit || 10,
          token // Pass token, might be null
        }
      );

      return {
        jobs: result.jobs || [],
        total: result.total || 0,
        externalJobsStatus: 'success'
      };
    } catch (error) {
      console.error('Error in getJobs:', error);
      return {
        jobs: [],
        total: 0,
        externalJobsStatus: 'error'
      };
    }
  }

  async fetchJobList(query, location, options = {}) {
    try {
      // Check rate limits
      const now = Date.now();
      if (now - this.lastRequestTime < this.minRequestInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minRequestInterval - (now - this.lastRequestTime))
        );
      }
      this.lastRequestTime = Date.now();

      // Make API request
      const response = await axios({
        method: 'GET',
        url: `https://${this.jsearchHost}/search`,
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.jsearchHost
        },
        params: {
          query: `${query} ${location}`,
          page: options.page || '1',
          num_pages: '1',
          date_posted: options.datePosted || 'all',
          remote_jobs_only: options.remoteOnly || false,
          employment_types: options.employmentType || 'FULLTIME',
          job_requirements: options.requirements || '',
          radius: options.radius || '100'
        }
      });

      if (response.data && response.data.data) {
        // Transform API response to our format
        return response.data.data.map(job => ({
          id: job.job_id,
          title: job.job_title,
          company_name: job.employer_name,
          company_logo: job.employer_logo,
          location: job.job_city || job.job_country || location,
          description: job.job_description,
          job_type: job.job_employment_type,
          salary_range: job.job_salary || 'Not specified',
          url: job.job_apply_link,
          source: 'JSearch API',
          is_external: true,
          posted_at: job.job_posted_at_datetime_utc
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching from JSearch API:', error);
      
      // Check if error is due to rate limit
      if (error.response?.status === 429) {
        this.apiStatus.jsearch.available = false;
        console.log('Rate limit reached for JSearch API');
      }

      // Return empty array on error
      return [];
    }
  }

  // ... rest of your existing methods but remove duplicates ...
}

// Create single instance
const jobsApi = new UnifiedJobsAPI();

// Export the instance as default export
export default jobsApi;

// Named exports
export const getJobs = async (filters = {}, token = null) => {
  try {
    return await jobsApi.getJobs(filters, token);
  } catch (error) {
    console.error('Error in getJobs wrapper:', error);
    return {
      jobs: [],
      total: 0,
      externalJobsStatus: 'error'
    };
  }
};

export const toggleSaveJob = async (userId, jobData, token) => {
  try {
    if (!token || !userId || !jobData) {
      throw new Error('Missing required data');
    }

    const success = await setSupabaseToken(token);
    if (!success) {
      throw new Error('Failed to authenticate');
    }

    // Set auth header
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: null
    });

    // Check if job is already saved
    const { data: existingJob, error: checkError } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', jobData.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingJob) {
      // Remove job
      const { error: deleteError } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', jobData.id);

      if (deleteError) throw deleteError;
      return { saved: false };
    } else {
      // Save job
      const { error: insertError } = await supabase
        .from('saved_jobs')
        .insert({
          user_id: userId,
          job_id: jobData.id,
          job_data: jobData,
          saved_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
      return { saved: true };
    }
  } catch (error) {
    console.error('Error toggling job save:', error);
    throw error;
  } finally {
    clearSupabaseSession(); // Clean up after operation
  }
};

export const getSavedJobs = async (userId, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }

    const success = await setSupabaseToken(token);
    if (!success) {
      throw new Error('Failed to authenticate');
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    throw error;
  } finally {
    clearSupabaseSession(); // Clean up after operation
  }
};

export const deleteSavedJob = async (jobId, userId, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }

    await supabase.auth.setSession({
      access_token: token,
      refresh_token: null
    });

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting saved job:', error);
    throw error;
  }
};

// ... rest of your exported functions ...
