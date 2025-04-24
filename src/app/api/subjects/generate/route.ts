import { NextRequest, NextResponse } from 'next/server';
import { generateSubjectsFromFile } from '@/app/lib-server/subjectService';
import { validateToken } from '@/app/lib-server/authService';
import { SubjectGenerationParams } from '@/app/models/subject';

/**
 * POST /api/subjects/generate - Generate subjects from a file
 * 
 * This endpoint now uses gpt-4o-mini which has much higher token limits (200K TPM)
 * and supports large files by processing them in chunks.
 * Large files are processed more efficiently than before due to the improved rate limits.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body.token;
    
    // Verify authentication if token is provided
    if (token) {
      const userId = await validateToken(token);
      if (!userId) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }
    
    // Extract parameters from the request body
    const { workspaceId, fileId, userId, aiProvider, locale, countRange, specificity } = body;
    
    if (!fileId || !workspaceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: fileId, workspaceId, or userId' },
        { status: 400 }
      );
    }
    
    // Log the locale for debugging
    console.log(`Using locale from subject generation request: ${locale || 'not provided'}`);
    
    const params: SubjectGenerationParams = {
      workspaceId,
      fileId,
      userId,
      aiProvider: aiProvider || 'openai',
      token,
      locale,
      countRange,
      specificity
    };
    
    console.log('Generating subjects with params:', params);
    
    // Generate subjects from the file
    const result = await generateSubjectsFromFile(params);
    const { existingSubjects, newSubjects } = result;
    const debugInfo = result.debug;
    
    // Check if any subjects were processed in chunks
    // We added a custom property to mark subjects processed in chunks
    const processedInChunks = [...existingSubjects, ...newSubjects].some((subject: any) => subject.processedInChunks === true);
    
    // Check for unrelated content response
    if (result.unrelatedContent) {
      return NextResponse.json({
        success: true,
        status: 'unrelated_content',
        message: result.unrelatedMessage,
        count: existingSubjects.length,
        existingSubjects: existingSubjects,
        newSubjects: [], // No new subjects in unrelated content case
        existingSubjectsCount: existingSubjects.length,
        newSubjectsCount: 0,
        hasNewSubjects: false,
        debugInfo: {
          locale: locale || 'not provided',
          model: "gpt-4o-mini",
          fileId: fileId,
          aiDebug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
        }
      });
    }
    
    const hasNewSubjects = newSubjects.length > 0;
    const totalCount = existingSubjects.length + newSubjects.length;
    
    return NextResponse.json({
      success: true,
      count: totalCount,
      existingSubjects: existingSubjects,
      newSubjects: newSubjects,
      newSubjectsCount: newSubjects.length,
      existingSubjectsCount: existingSubjects.length,
      hasNewSubjects: hasNewSubjects,
      debugInfo: {
        locale: locale || 'not provided',
        model: "gpt-4o-mini",
        fileId: fileId,
        processedInChunks: processedInChunks,
        aiDebug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
      },
      tier1Warning: processedInChunks ? 
        "Your file was processed in smaller chunks due to its size. The processing uses gpt-4o-mini which has higher token limits (200K TPM) for better handling of large files." : 
        undefined,
      processedInChunks: processedInChunks,
      model: "gpt-4o-mini"
    });
  } catch (error: any) {
    console.error('Error generating subjects:', error);
    
    // Check for specific error types and provide more useful responses
    let status = 500;
    let errorMessage = error.message || 'Failed to generate subjects';
    
    // Handle rate limit errors specifically
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      status = 429;
      errorMessage = 'OpenAI API rate limit exceeded. We recommend:' +
        '\n1. Try again in a few minutes' +
        '\n2. Use a smaller file' +
        '\n3. The system is using gpt-4o-mini which has higher limits (200K TPM) but you may still hit limits with extremely large files';
    }
    // Handle token/context length errors
    else if (errorMessage.includes('too large') || errorMessage.includes('exceeds model limit')) {
      status = 413;
      errorMessage = 'File content is too large. Please try with a smaller file.';
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        code: status,
        tierLimitInfo: status === 429 ? {
          model: "gpt-4o-mini",
          limitInfo: "gpt-4o-mini has a limit of 200,000 tokens per minute, which is much higher than gpt-4o's 30,000 TPM.",
          upgradeInfo: "We're already using the model with higher token limits."
        } : undefined,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status }
    );
  }
} 