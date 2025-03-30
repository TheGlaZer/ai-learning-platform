import { NextRequest } from 'next/server';
import { supabase } from './supabaseClient';

/**
 * Extract the authentication token from the incoming request
 * Looks for the token in the Authorization header
 */
export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }
  
  // Extract the token from the Bearer format
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  
  return null;
}

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
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }
  
  return await validateToken(token);
}