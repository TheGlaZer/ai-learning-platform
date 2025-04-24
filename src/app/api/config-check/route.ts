import { NextResponse } from 'next/server';
import { AIConfig, AIFeatureType } from '@/app/lib-server/ai/AIConfig';
import { AIServiceFactory } from '@/app/lib-server/ai/AIServiceFactory';

export async function GET() {
  try {
    // Check AIConfig setup
    const aiConfig = AIConfig.getInstance();
    const featureMap = new Map();
    
    // Get configurations for all features (without exposing sensitive info)
    const features: AIFeatureType[] = ['quiz_generation', 'subject_extraction', 'quiz_explanation', 'default'];
    features.forEach(feature => {
      const config = aiConfig.getFeatureConfig(feature);
      featureMap.set(feature, {
        provider: config?.provider || 'not configured',
        model: config?.model || 'not configured',
        temperature: config?.temperature
      });
    });
    
    // Try to create services to validate configuration
    const openaiServiceAvailable = isServiceAvailable('openai');
    const anthropicServiceAvailable = isServiceAvailable('anthropic');
    
    return NextResponse.json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      aiFeatures: Object.fromEntries(featureMap),
      services: {
        openai: {
          available: openaiServiceAvailable,
          hasKey: !!process.env.OPENAI_API_KEY,
          keyLength: process.env.OPENAI_API_KEY?.length || 0
        },
        anthropic: {
          available: anthropicServiceAvailable,
          hasKey: !!process.env.ANTHROPIC_API_KEY,
          keyLength: process.env.ANTHROPIC_API_KEY?.length || 0
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Config check failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Helper function to check if a service can be instantiated
function isServiceAvailable(provider: 'openai' | 'anthropic'): boolean {
  try {
    const service = AIServiceFactory.createService(provider);
    return true;
  } catch (error) {
    console.error(`Error creating ${provider} service:`, error);
    return false;
  }
} 