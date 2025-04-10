'use client';

import { usePathname } from 'next/navigation';

/**
 * Custom hook to get the current locale from the URL path
 * @returns The current locale (e.g., 'en', 'he')
 */
export function useUserLocale(): string {
  const pathname = usePathname();
  
  if (!pathname) return 'he'; // Default to Hebrew if pathname is null
  
  // Extract locale from the first segment of the URL path
  // URL pattern is /{locale}/rest-of-path
  const locale = pathname.split('/')[1];
  
  // Check if locale is valid
  if (locale && ['en', 'he'].includes(locale)) {
    return locale;
  }
  
  // Default to Hebrew if no valid locale found
  return 'he';
} 