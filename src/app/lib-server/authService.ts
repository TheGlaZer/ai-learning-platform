import { NextRequest } from 'next/server';
import { supabase } from './supabaseClient';

/**
 * Get authentication token from request
 * Tries to extract from Authorization header first, then from body if header is not present
 */
export const extractToken = async (request: Request): Promise<string | null> => {
  // First try to get from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return authHeader.replace('Bearer ', '');
  }
  
  // If not in header, try the request body
  try {
    // Clone the request to avoid consuming the body
    const clonedRequest = request.clone();
    const body = await clonedRequest.json();
    return body.token || null;
  } catch (e) {
    // Body might be empty or not valid JSON
    return null;
  }
};

/**
 * Validate a token and get the user ID
 * Returns null if the token is invalid
 */
export async function validateToken(token: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user.id;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}

/**
 * Verify authentication for the current request
 * Returns the user ID if authenticated, null otherwise
 */
export async function verifyAuth(req: NextRequest): Promise<string | null> {
  const token = await extractToken(req);
  if (!token) {
    return null;
  }
  
  return await validateToken(token);
}