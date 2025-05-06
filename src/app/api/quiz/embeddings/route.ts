import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/lib-server/auth/authService';
import { generateQuizWithEmbeddings } from '@/app/lib-server/quiz/embeddingBasedQuizService';
import { QuizGenerationParams } from '@/app/models/quiz';

/**
 * POST /api/quiz/embeddings
 * Generates a quiz using embedding-based content matching
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = authResult.userId;
    const token = authResult.token;
    
    // Parse request body
    const params = await request.json();
    
    // Add user ID and token to parameters
    const quizParams: QuizGenerationParams = {
      ...params,
      userId,
      token
    };
    
    // Generate quiz using embeddings
    const generatedQuiz = await generateQuizWithEmbeddings(quizParams);
    
    return NextResponse.json({ quiz: generatedQuiz });
  } catch (error: any) {
    console.error('Error in embedding-based quiz generation:', error);
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate quiz',
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
} 