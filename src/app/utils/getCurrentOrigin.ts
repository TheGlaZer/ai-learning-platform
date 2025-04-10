export function getCurrentOrigin() {
  if (typeof window !== 'undefined') {
    // Client-side: use window.location
    return window.location.origin;
  }
  
  // Server-side: use environment variable or default to localhost:3000
  return process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:3000';
} 