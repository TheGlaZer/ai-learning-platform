import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();
 
/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
    compiler: {
        emotion: {
          sourceMap: true,
          autoLabel: "always",         // Always add labels in development
          labelFormat: "[filename]-[local]", // Use the filename and the local variable name in the label
        },
    },
    // Configure server-side features
    experimental: {
      serverComponentsExternalPackages: [
        'pdf-parse',
        'mammoth',
        'jszip',
        'xml2js'
      ],
    },
    // Allow server components to properly load node modules
    webpack: (config, { isServer }) => {
      if (isServer) {
        // Server-specific webpack config
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        };
      }
      return config;
    },
};
 
export default withNextIntl(nextConfig);