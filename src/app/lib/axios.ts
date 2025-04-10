import axios from 'axios';
import { getCurrentOrigin } from '@/app/utils/getCurrentOrigin';
import { createClient } from '@supabase/supabase-js';

// Create a supabase client just for auth purposes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const axiosInstance = axios.create({
  baseURL: getCurrentOrigin(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to handle errors and add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      try {
        // Get the current session using Supabase's method
        const { data: { session } } = await supabase.auth.getSession();
        
        // If session exists, add the access token to the Authorization header
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
          console.log('Added auth token to request:', config.url);
        } else {
          console.log('No session found for request:', config.url);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases here
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 