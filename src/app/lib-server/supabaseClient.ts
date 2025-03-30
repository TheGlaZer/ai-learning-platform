import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './envConfig';

// Validate required credentials
if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_ANON_KEY environment variable');
}
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
