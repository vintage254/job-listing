import axios from 'axios';
import supabase, { setSupabaseToken, clearSupabaseSession } from '@/lib/supabase';

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const BACKGROUND_REFRESH_THRESHOLD = 4 * 24 * 60 * 60 * 1000; // 4 days

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
  }

  async searchJobs(query, location = 'Kenya', options = {}) {
    try {
      const cacheKey = this.generateCacheKey(query, location, options);
      
      // Try cache first if we have a token
      if (options.token) {
        const cachedData = await this.getCachedJobs(cacheKey, options.token);
        if (cachedData) {
          return { ...cachedData.job_data, source: 'cache' };
        }
      }

      // Fetch fresh data
      const freshData = await this.fetchFreshJobs(query, location, options);
      
      // Cache if we have a token
      if (options.token && freshData.jobs.length > 0) {
        await this.setCachedJobs(cacheKey, freshData, options.token);
      }

      return { ...freshData, source: 'api' };
    } catch (error) {
      console.error('Error in searchJobs:', error);
      return { jobs: [], total: 0, source: 'error' };
    }
  }

  async fetchFreshJobs(query, location, options = {}) {
    try {
      // Check rate limits
      const now = Date.now();
      if (now - this.lastRequestTime < this.minRequestInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minRequestInterval - (now - this.lastRequestTime))
        );
      }

      const response = await axios.get(`https://${this.jsearchHost}/search`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.jsearchHost
        },
        params: {
          query: `${query} ${location}`,
          page: options.page || '1',
          num_pages: '1',
          date_posted: options.datePosted || 'all',
          remote_jobs_only: options.remoteOnly || false
        }
      });

      this.lastRequestTime = Date.now();

      if (response.data?.data) {
        const jobs = this.processJobData(response.data.data);
        return {
          jobs,
          total: jobs.length
        };
      }

      return { jobs: [], total: 0 };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return { jobs: [], total: 0 };
    }
  }

  processJobData(jobs) {
    return jobs.map(job => ({
      id: job.job_id,
      title: job.job_title,
      company_name: job.employer_name,
      company_logo: job.employer_logo,
      location: job.job_city || job.job_country,
      description: job.job_description,
      job_type: job.job_employment_type,
      salary_range: job.job_salary || 'Not specified',
      url: job.job_apply_link,
      source: 'JSearch API',
      posted_at: job.job_posted_at_datetime_utc
    }));
  }

  async getCachedJobs(key, token) {
    try {
      const { data, error } = await this.supabase
        .from('cached_jobs')
        .select('*')
        .eq('query_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  async setCachedJobs(key, data, token) {
    try {
      const { error } = await this.supabase
        .from('cached_jobs')
        .upsert({
          query_key: key,
          job_data: data,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + CACHE_DURATION).toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  generateCacheKey(query, location, options) {
    return `jobs_${query}_${location}_${options.page || 1}`;
  }

  // ... rest of the class methods ...
}

// Create single instance
const jobsApi = new UnifiedJobsAPI();

// Export all functions
export const getJobs = async (filters = {}, token = null) => {
  try {
    console.log('Getting jobs with filters:', filters);
    return await jobsApi.searchJobs(
      filters.searchQuery || '',
      filters.location || 'Kenya',
      {
        datePosted: 'all',
        remoteOnly: filters.remoteOnly || false,
        page: filters.page || 1,
        limit: filters.limit || 10,
        token
      }
    );
  } catch (error) {
    console.error('Error in getJobs:', error);
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

    await setSupabaseToken(token);

    try {
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
        // Remove job if already saved
        const { error: deleteError } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', jobData.id);

        if (deleteError) throw deleteError;
        return { saved: false };
      } else {
        // Save new job
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
    } finally {
      clearSupabaseSession(); // Clean up after operation
    }
  } catch (error) {
    console.error('Error toggling job save:', error);
    throw error;
  }
};

export const getSavedJobs = async (userId, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }

    await setSupabaseToken(token);

    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } finally {
      clearSupabaseSession();
    }
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    throw error;
  }
};

export const deleteSavedJob = async (jobId, userId, token) => {
  try {
    if (!token) {
      throw new Error('Authentication required');
    }

    await setSupabaseToken(token);

    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .match({
          user_id: userId,
          job_id: jobId
        });

      if (error) throw error;
      return true;
    } finally {
      clearSupabaseSession();
    }
  } catch (error) {
    console.error('Error deleting saved job:', error);
    throw error;
  }
};

// Default export of the API instance
export default jobsApi;
