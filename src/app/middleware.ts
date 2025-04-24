import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: '/api/:path*',
};

export function middleware(request: NextRequest) {
  // Set increased limits for API routes
  const response = NextResponse.next();
  
  // Add headers that might help with large requests
  response.headers.set('Accept-Encoding', 'gzip, deflate, br');
  response.headers.set('Connection', 'keep-alive');
  
  return response;
} 