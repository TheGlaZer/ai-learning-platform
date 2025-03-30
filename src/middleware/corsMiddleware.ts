// src/middleware/corsMiddleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function corsMiddleware(req: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // If this is a preflight OPTIONS request, return immediately.
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      headers: response.headers,
      status: 200,
    });
  }
  return response;
}
