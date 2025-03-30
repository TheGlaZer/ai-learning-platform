// src/middleware.ts
import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { corsMiddleware } from "./middleware/corsMiddleware";

const nextIntlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  // In development mode, if the request is for an API route, apply CORS middleware.
  if (
    process.env.NODE_ENV === "development" &&
    req.nextUrl.pathname.startsWith("/api/")
  ) {
    return corsMiddleware(req);
  }

  // Otherwise, handle the request with Next‑Intl middleware.
  return nextIntlMiddleware(req);
}

// Configure matcher so that API routes are only included in dev mode.
export const config = {
  matcher: [
    "/",
    "/(de|en)/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/(de|en|he)/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
