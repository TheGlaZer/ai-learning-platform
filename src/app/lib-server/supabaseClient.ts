import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './envConfig';

// Validate required credentials
if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_ANON_KEY environment variable');
}

// Default supabase client for unauthenticated operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Get a Supabase client with the user's session for server-side operations
 * This allows RLS policies to work correctly by providing auth.uid()
 */
export async function getAuthenticatedClient(jwt: string) {
  // Create a new client to avoid side effects with the shared client
  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
  });
  
  return supabaseAuth;
}
