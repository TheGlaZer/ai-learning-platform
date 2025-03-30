import { NextRequest, NextResponse } from 'next/server';
import { generateQuiz, getQuizById, getQuizzesByWorkspace } from '@/app/lib-server/quizService';
import { QuizGenerationParams } from '@/app/models/quiz';
import { getTokenFromRequest } from '@/app/lib-server/authService';

// Generate a quiz
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileId, topic, numberOfQuestions, difficultyLevel, userId, workspaceId, aiProvider } = body;

    // Validate required fields
    if (!fileId || !topic || !numberOfQuestions || !difficultyLevel || !userId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const params: QuizGenerationParams = {
      fileId,
      topic,
      numberOfQuestions,
      difficultyLevel,
      userId,
      workspaceId,
      aiProvider: aiProvider || 'openai',
    };

    const quiz = await generateQuiz(params);
    
    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

// Get quizzes for a workspace
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const quizId = searchParams.get('quizId');

    // If quizId is provided, get a specific quiz
    if (quizId) {
      const quiz = await getQuizById(quizId);
      return NextResponse.json(quiz);
    }

    // If workspaceId is provided, get quizzes for that workspace
    if (workspaceId) {
      const quizzes = await getQuizzesByWorkspace(workspaceId);
      return NextResponse.json(quizzes);
    }

    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}