import { getCurrentOrigin } from './getCurrentOrigin';

/**
 * Ensures API URLs don't include the locale prefix
 * @param path The API path 
 * @returns The full API URL without locale prefix
 */
export function getApiUrl(path: string): string {
  const baseUrl = getCurrentOrigin();
  
  // Strip any locale prefixes (en, de, he) from the path
  let cleanPath = path.replace(/^\/(en|de|he)\/api\//, '/api/');
  
  // Ensure path starts with /api/
  if (!cleanPath.startsWith('/api/')) {
    cleanPath = `/api/${cleanPath.replace(/^\//, '')}`;
  }
  
  return `${baseUrl}${cleanPath}`;
}

/**
 * Transforms any relative URL to use the correct API format
 * @param url The URL to transform
 * @returns The properly formatted URL
 */
export function transformUrl(url: string): string {
  // If it's an API URL, use the API utility
  if (url.includes('/api/') || !url.startsWith('/')) {
    return getApiUrl(url);
  }
  
  // Otherwise return as is (for non-API routes)
  return url;
} 