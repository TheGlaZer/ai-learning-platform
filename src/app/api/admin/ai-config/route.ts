import { NextResponse } from 'next/server';
import { AIConfig, AIFeatureType, AIModelConfig } from '@/app/lib-server/ai/AIConfig';
import { supabase } from '@/app/lib-server/supabaseClient';

// Helper to check admin permissions
async function isAdmin(request: Request): Promise<boolean> {
  // Get the authorization token
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify the token and check admin role
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return false;
    }
    
    // Get user roles/metadata
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) {
      return false;
    }
    
    // Check if user is admin
    return profile.is_admin === true || profile.role === 'admin';
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return false;
  }
}

// GET: Retrieve current AI configurations
export async function GET(request: Request) {
  // Check admin permissions
  const isAdminUser = await isAdmin(request);
  if (!isAdminUser) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const aiConfig = AIConfig.getInstance();
    
    // Get configurations for all features
    const featureTypes: AIFeatureType[] = [
      'quiz_generation',
      'subject_extraction',
      'content_summarization',
      'quiz_explanation',
      'code_analysis',
      'general_chat',
      'default'
    ];
    
    const configurations: Record<AIFeatureType, AIModelConfig | undefined> = {} as any;
    
    featureTypes.forEach(featureType => {
      configurations[featureType] = aiConfig.getFeatureConfig(featureType);
    });
    
    return NextResponse.json({
      success: true,
      data: configurations
    });
  } catch (error: any) {
    console.error('Error retrieving AI configurations:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred while retrieving AI configurations' 
    }, { status: 500 });
  }
}

// POST: Update AI configuration for a specific feature
export async function POST(request: Request) {
  // Check admin permissions
  const isAdminUser = await isAdmin(request);
  if (!isAdminUser) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const { feature, config } = await request.json();
    
    // Validate request
    if (!feature || !config) {
      return NextResponse.json({ 
        success: false, 
        message: 'Feature and configuration are required' 
      }, { status: 400 });
    }
    
    if (!config.provider) {
      return NextResponse.json({ 
        success: false, 
        message: 'Provider is required in configuration' 
      }, { status: 400 });
    }
    
    // Update configuration
    const aiConfig = AIConfig.getInstance();
    aiConfig.updateFeatureConfig(feature as AIFeatureType, config);
    
    return NextResponse.json({
      success: true,
      message: `AI configuration for "${feature}" updated successfully`,
      data: aiConfig.getFeatureConfig(feature as AIFeatureType)
    });
  } catch (error: any) {
    console.error('Error updating AI configuration:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred while updating AI configuration' 
    }, { status: 500 });
  }
}

// DELETE: Reset AI configuration for a specific feature
export async function DELETE(request: Request) {
  // Check admin permissions
  const isAdminUser = await isAdmin(request);
  if (!isAdminUser) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const url = new URL(request.url);
    const feature = url.searchParams.get('feature');
    
    if (!feature) {
      return NextResponse.json({ 
        success: false, 
        message: 'Feature parameter is required' 
      }, { status: 400 });
    }
    
    // Reset to defaults
    const aiConfig = AIConfig.getInstance();
    aiConfig.resetFeatureConfig(feature as AIFeatureType);
    
    return NextResponse.json({
      success: true,
      message: `AI configuration for "${feature}" reset to defaults`,
      data: aiConfig.getFeatureConfig(feature as AIFeatureType)
    });
  } catch (error: any) {
    console.error('Error resetting AI configuration:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred while resetting AI configuration' 
    }, { status: 500 });
  }
} 