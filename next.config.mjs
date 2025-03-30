/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Environment variables that will be available to the browser
  env: {
    // Note: Only add variables here that you want accessible in client-side code
    // Sensitive variables should stay in .env without NEXT_PUBLIC_ prefix
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  
  // Other Next.js configuration
  experimental: {
    // Any experimental features you're using
  }
};

export default nextConfig;