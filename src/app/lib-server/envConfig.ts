// Environment configuration for server-side components
// No need to use loadEnvConfig as Next.js automatically loads .env files

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Log environment variable status during initialization
console.log('Environment configuration loaded:');
console.log(`- SUPABASE_URL available: ${SUPABASE_URL ? 'yes' : 'no'}`);
console.log(`- SUPABASE_ANON_KEY available: ${SUPABASE_ANON_KEY ? 'yes' : 'no'}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY available: ${SUPABASE_SERVICE_ROLE_KEY ? 'yes' : 'no'}`);

// Add any other environment variables you need