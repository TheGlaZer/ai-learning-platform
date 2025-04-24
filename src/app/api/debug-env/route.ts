import { NextResponse } from 'next/server';

export async function GET() {
  // Redact API keys for security but show if they exist
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasOpenAIKey,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    hasAnthropicKey,
    anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
    apiOrigin: process.env.NEXT_PUBLIC_API_ORIGIN,
    amplifyUrl: process.env.AMPLIFY_URL,
    // Add any other environment variables you want to check (without exposing sensitive values)
  });
} 