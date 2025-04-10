import { NextResponse } from 'next/server';
import { extractToken } from '@/app/lib-server/authService';
import { getUserQuizSubmission } from '@/app/lib-server/quizAnswerService';

export const dynamic = 'force-dynamic';
// Force Node.js runtime for this API route

// Get quiz submission by quizId and userId
export async function GET(req: Request) {
  try {
    const token = await extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const quizId = url.searchParams.get('quizId');
    const userId = url.searchParams.get('userId');
    const workspaceId = url.searchParams.get('workspaceId');

    // Validate required fields
    if (!quizId || !userId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields: quizId, userId or workspaceId' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quizId) || !uuidRegex.test(workspaceId)) {
      return NextResponse.json(
        { error: 'Invalid UUID format for quizId or workspaceId' },
        { status: 400 }
      );
    }

    const result = await getUserQuizSubmission(quizId, userId, workspaceId, token);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error retrieving quiz submission:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to retrieve quiz submission',
        details: error.stack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 