import { NextResponse } from 'next/server';

export async function GET() {
  // Return actual environment variable values
  const apiKeys = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_ORIGIN: process.env.NEXT_PUBLIC_API_ORIGIN,
    NODE_ENV: process.env.NODE_ENV,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  };

  // Count how many keys are present
  const totalKeys = Object.keys(apiKeys).length;
  const presentKeys = Object.values(apiKeys).filter(value => !!value).length;

  return NextResponse.json({
    message: "API Key Values",
    status: "success",
    data: {
      apiKeys,
      summary: {
        totalKeys,
        presentKeys,
        missingKeys: totalKeys - presentKeys
      }
    }
  }, { status: 200 });
} 