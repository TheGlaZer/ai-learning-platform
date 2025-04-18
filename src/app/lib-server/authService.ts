import { NextRequest } from 'next/server';
import { supabase } from './supabaseClient';

/**
 * Get authentication token from request
 * Tries to extract from Authorization header first, then from body if header is not present
 */
export const extractToken = async (request: Request): Promise<string | null> => {
  console.log('Extracting token from request...');
  
  // First try to get from Authorization header
  const authHeader = request.headers.get('authorization');
  console.log('Authorization header:', authHeader);
  
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted from header:', token ? `${token.substring(0, 10)}...` : 'No token');
    return token;
  }
  
  // If not in header, try the request body
  try {
    // Clone the request to avoid consuming the body
    const clonedRequest = request.clone();
    console.log('Attempting to extract token from request body...');
    
    const body = await clonedRequest.json();
    console.log('Request body available:', !!body);
    
    const bodyToken = body.token || null;
    console.log('Token from body:', bodyToken ? `${bodyToken.substring(0, 10)}...` : 'No token');
    
    return bodyToken;
  } catch (e) {
    // Body might be empty or not valid JSON
    console.log('Error extracting token from body:', e.message);
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
 * Returns the user ID and token if authenticated, or null values if not
 */
export async function verifyAuth(req: NextRequest): Promise<{ userId: string | null, token: string | null }> {
  const token = await extractToken(req);
  if (!token) {
    return { userId: null, token: null };
  }
  
  const userId = await validateToken(token);
  return { userId, token };
}