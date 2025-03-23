import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();
 
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
      },
      compiler: {
        emotion: {
          sourceMap: true,
          autoLabel: "always",         // Always add labels in development
          labelFormat: "[filename]-[local]", // Use the filename and the local variable name in the label
        },
      },
};
 
export default withNextIntl(nextConfig);