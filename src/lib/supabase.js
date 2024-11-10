import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single instance with better auth configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Don't persist since we're using Clerk
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Helper function to set auth session
export const setSupabaseToken = async (token) => {
  if (!token) return false;
  
  try {
    // Set auth header directly
    supabase.rest.headers['Authorization'] = `Bearer ${token}`;
    
    // Also set the session for compatibility
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: null,
      expires_in: 3600
    });

    return true;
  } catch (error) {
    console.error('Error setting Supabase session:', error);
    return false;
  }
};

// Helper to clear session
export const clearSupabaseSession = () => {
  delete supabase.rest.headers['Authorization'];
};

// Helper to check if token is set
export const isAuthenticated = () => {
  return !!supabase.rest.headers['Authorization'];
};

export default supabase; 