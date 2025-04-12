// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { corsMiddleware } from "./middleware/corsMiddleware";

const nextIntlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  console.log('Middleware - Request URL:', req.url);
  
  const { pathname } = req.nextUrl;
  
  // If it's an API route
  if (pathname.includes('/api/')) {
    // Check if the path has a locale prefix before /api/
    const hasLocalePrefix = /^\/(en|de|he)\/api\//.test(pathname);
    
    if (hasLocalePrefix) {
      // Rewrite the URL to remove the locale prefix for API routes
      const newUrl = new URL(req.url);
      newUrl.pathname = pathname.replace(/^\/(en|de|he)\/api\//, '/api/');
      
      // Create a new request with the modified URL for proper rewriting
      const newReq = new NextRequest(newUrl, req);
      
      // Apply CORS in development mode if needed
      if (process.env.NODE_ENV === "development") {
        return corsMiddleware(newReq);
      }
      
      return NextResponse.rewrite(newUrl);
    }
    
    // If it's a direct /api/ call without locale prefix, just apply CORS in dev mode if needed
    if (process.env.NODE_ENV === "development") {
      return corsMiddleware(req);
    }
    
    // Otherwise, let the API request proceed as is
    return NextResponse.next();
  }

  // For non-API routes, handle with Next-Intl middleware
  return nextIntlMiddleware(req);
}

// Configure matcher to ensure we catch both direct API routes and those with locale prefixes
export const config = {
  matcher: [
    "/",
    "/(de|en|he)/:path*", 
    "/api/:path*",
    "/(de|en|he)/api/:path*", // Also match API routes with locale prefixes
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
