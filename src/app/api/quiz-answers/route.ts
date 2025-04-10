import { NextResponse } from 'next/server';
import { extractToken } from '@/app/lib-server/authService';
import { submitQuizAnswers } from '@/app/lib-server/quizAnswerService';
import { SubmitQuizAnswersParams } from '@/app/models/quizAnswer';

export const dynamic = 'force-dynamic'; // This ensures the route is not statically optimized
export const maxDuration = 30; // 30 seconds
export const runtime = 'nodejs'; // Force Node.js runtime for this API route

// Submit quiz answers
export async function POST(req: Request) {
  try {
    console.log('Quiz answers submission endpoint hit');
    const token = await extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Received request body:', body);
    
    const { 
      quizId, 
      userId, 
      workspaceId, 
      answers
    } = body;

    // Validate required fields
    if (!quizId || !userId || !workspaceId || !answers || !Array.isArray(answers)) {
      console.log('Missing required fields:', { quizId, userId, workspaceId, answers });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quizId) || !uuidRegex.test(workspaceId)) {
      console.error('Invalid UUID format:', { quizId, workspaceId });
      return NextResponse.json(
        { error: 'Invalid UUID format for quizId or workspaceId' },
        { status: 400 }
      );
    }

    const params: SubmitQuizAnswersParams = {
      quizId,
      userId,
      workspaceId,
      answers,
      token
    };

    console.log('Submitting quiz answers with params:', {
      quizId: params.quizId,
      userId: params.userId,
      workspaceId: params.workspaceId,
      answersCount: params.answers.length
    });
    
    const result = await submitQuizAnswers(params);
    console.log('Quiz answers submitted successfully');
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error submitting quiz answers:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to submit quiz answers',
        details: error.stack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 