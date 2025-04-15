# API Route Locale Fix Instructions

This document outlines the changes made to fix the 404 error issue with API routes in the internationalized application.

## The Problem

The application was experiencing 404 errors in production when making API requests. This happened because:

1. The app uses path-based internationalization with `/en`, `/de`, and `/he` locale prefixes
2. The client-side code was sending requests to `/he/api/workspaces` (with locale)
3. The actual API endpoint is at `/api/workspaces` (without locale)

## Implemented Fix

We implemented a solution with three main components:

### 1. API URL Transformation Utility

Created a new utility file `src/app/utils/apiUtils.ts` that:
- Provides a `getApiUrl()` function to strip locale prefixes from API paths
- Provides a `transformUrl()` function for general URL transformation

### 2. Updated Middleware

Modified `src/middleware.ts` to:
- Detect API routes with locale prefixes
- Rewrite requests to remove the locale prefix for API routes
- Maintain the locale prefix for regular (non-API) routes

### 3. Updated Axios Configuration

Modified `src/app/lib/axios.ts` to:
- Remove the `baseURL` configuration to avoid path conflicts
- Add a request interceptor that transforms all URLs using the new utility
- Ensure proper header and auth token handling

## How It Works

1. When a request is made to `/he/api/workspaces`:
   - The middleware detects the locale prefix in an API route
   - It rewrites the URL to `/api/workspaces`
   - The request proceeds to the correct API endpoint

2. When a client makes an API request:
   - The axios interceptor applies URL transformation
   - The API path is corrected before the request is sent
   - The request reaches the proper API endpoint

## Testing Required

Please test the following scenarios:

1. API requests from different locale paths (`/he/`, `/en/`, `/de/`)
2. Direct API requests (without locale)
3. Non-API requests with locale prefixes
4. Different API endpoints (workspaces, quizzes, files, etc.)

## Troubleshooting

If you encounter issues:

1. Check browser console for any errors
2. Verify the middleware is correctly detecting and rewriting API URLs
3. Confirm the axios interceptor is transforming URLs properly
4. Ensure all API client code is using the axios instance 