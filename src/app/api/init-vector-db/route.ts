'use server';

import { NextRequest, NextResponse } from 'next/server';
import { AIConfig } from '@/app/lib-server/ai/AIConfig';

/**
 * API route to enable or disable vector database integration
 * This should be called during application initialization
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { enable = true } = body;
    
    // Get AI configuration
    const aiConfig = AIConfig.getInstance();
    
    // Enable vector integration
    aiConfig.enableVectorIntegration(enable);
    
    return NextResponse.json({
      success: true,
      message: `Vector database integration ${enable ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error setting vector integration:', error);
    return NextResponse.json(
      { error: 'Failed to set vector integration', details: (error as Error).message },
      { status: 500 }
    );
  }
} 