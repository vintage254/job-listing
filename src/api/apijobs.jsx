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
          // Check for background refresh
          const cacheAge = Date.now() - new Date(cachedData.cached_at).getTime();
          if (cacheAge > BACKGROUND_REFRESH_THRESHOLD) {
            this.refreshCacheInBackground(query, location, options);
          }
          return { ...cachedData.job_data, source: 'cache' };
        }
      }

      // Fetch fresh data
      return await this.fetchFreshJobs(query, location, options);
    } catch (error) {
      console.error('Error in searchJobs:', error);
      return { jobs: [], total: 0, source: 'error' };
    }
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
