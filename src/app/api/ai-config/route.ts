import { NextRequest, NextResponse } from 'next/server';
import { AIConfig, AIFeatureType } from '@/app/lib-server/ai/AIConfig';
import { AIModelManager } from '@/app/lib-server/ai/AIModelManager';
import { verifyAuth } from '@/app/lib-server/auth/authService';

/**
 * GET handler for AI configuration
 * Returns current AI configuration and available models
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication (admin only)
    const { userId, token } = await verifyAuth(req);
    if (!userId || !token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // TODO: Add admin role check here
    // For now, we'll assume all authenticated users can access this endpoint
    
    // Get AI configuration
    const aiConfig = AIConfig.getInstance();
    const modelManager = AIModelManager.getInstance();
    
    // Build response with current feature configurations and available models
    const response = {
      features: {} as Record<string, any>,
      models: modelManager.getAllModels()
    };
    
    // Get config for each feature
    const features: AIFeatureType[] = [
      'quiz_generation',
      'subject_extraction',
      'content_summarization',
      'quiz_explanation',
      'code_analysis',
      'general_chat',
      'default'
    ];
    
    features.forEach(feature => {
      const config = aiConfig.getFeatureConfig(feature);
      const modelInfo = config?.model ? modelManager.getModelInfo(config.model) : null;
      
      response.features[feature] = {
        ...config,
        modelInfo
      };
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in AI config endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH handler to update AI configuration
 */
export async function PATCH(req: NextRequest) {
  try {
    // Verify authentication (admin only)
    const { userId, token } = await verifyAuth(req);
    if (!userId || !token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // TODO: Add admin role check here
    // For now, we'll assume all authenticated users can access this endpoint
    
    // Parse request body
    const body = await req.json();
    const { feature, modelId, temperature } = body;
    
    // Validate input
    if (!feature || !modelId) {
      return NextResponse.json({ error: 'Feature and modelId are required' }, { status: 400 });
    }
    
    // Get AIConfig instance
    const aiConfig = AIConfig.getInstance();
    
    // Update configuration
    aiConfig.updateFeatureByModelId(feature as AIFeatureType, modelId, temperature);
    
    // Get the updated configuration
    const updatedConfig = aiConfig.getFeatureConfig(feature as AIFeatureType);
    const modelManager = AIModelManager.getInstance();
    const modelInfo = updatedConfig?.model ? modelManager.getModelInfo(updatedConfig.model) : null;
    
    return NextResponse.json({
      message: `Configuration for ${feature} updated successfully`,
      feature,
      config: {
        ...updatedConfig,
        modelInfo
      }
    });
  } catch (error) {
    console.error('Error updating AI config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 