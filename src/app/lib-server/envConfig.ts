// Environment configuration for server-side components
// No need to use loadEnvConfig as Next.js automatically loads .env files

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Add any other environment variables you need