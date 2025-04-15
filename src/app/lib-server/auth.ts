/**
 * Authentication helper utilities for server-side API routes
 */
import { validateToken, extractToken } from './authService';

/**
 * Authenticates a request and returns the user ID if valid
 * @param req The incoming request
 * @returns Object containing userId if successful, or error message if failed
 */
export async function authenticateRequest(req: Request): Promise<{ userId: string | null, error: string | null }> {
  try {
    // Extract the token from the request
    const token = await extractToken(req);
    if (!token) {
      return { userId: null, error: 'Authentication token is missing' };
    }
    
    // Validate the token and get the user ID
    const userId = await validateToken(token);
    if (!userId) {
      return { userId: null, error: 'Invalid or expired authentication token' };
    }
    
    return { userId, error: null };
  } catch (error) {
    console.error('Authentication error:', error);
    return { userId: null, error: 'Authentication failed' };
  }
} 