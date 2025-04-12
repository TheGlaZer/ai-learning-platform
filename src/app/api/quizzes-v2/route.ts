import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib-server/supabaseClient';
import { generateQuiz, getQuizzesByWorkspace } from '@/app/lib-server/quizService';
import { QuizGenerationParams } from '@/app/models/quiz';
import { extractToken } from '@/app/lib-server/authService';

export const dynamic = 'force-dynamic'; // This ensures the route is not statically optimized
export const maxDuration = 60; // 5 minutes
export const runtime = 'nodejs'; // Force Node.js runtime for this API route

export async function GET(req: Request) {
  try {
    console.log('Quizzes-v2 route hit!');
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');
    
    if (!workspaceId) {
      console.log('Missing workspaceId parameter');
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }
    

    // Extract the authorization token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    console.log(`TOKEN QUIZZES-V2 !!!!!!: ${token}`);
    
    // Use the quizService with the token instead of direct Supabase query
    const quizzes = await getQuizzesByWorkspace(workspaceId, token || undefined);
    console.log(`Found ${quizzes.length} quizzes`);
    
    return NextResponse.json(quizzes);
  } catch (error: any) {
    console.error('Error in quizzes-v2 route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

// Generate a quiz
export async function POST(req: Request) {
  try {
    console.log('Quiz generation endpoint hit');
    const token = await extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Received request body:', body);
    
    const { 
      fileId, 
      topic, 
      numberOfQuestions, 
      difficultyLevel, 
      userId, 
      workspaceId, 
      aiProvider, 
      locale,
      userComments,
      selectedSubjects,
      includeFileReferences
    } = body;

    // Validate required fields
    if (!fileId || !topic || !numberOfQuestions || !difficultyLevel || !userId || !workspaceId) {
      console.log('Missing required fields:', { fileId, topic, numberOfQuestions, difficultyLevel, userId, workspaceId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the locale for debugging
    console.log(`Using locale from request: ${locale || 'not provided'}`);
    console.log(`File reference inclusion: ${includeFileReferences !== false ? 'enabled' : 'disabled'}`);

    const params: QuizGenerationParams = {
      fileId,
      topic,
      numberOfQuestions,
      difficultyLevel,
      userId,
      workspaceId,
      aiProvider: aiProvider || 'openai',
      token, // Pass the token to the quiz generation function
      locale,  // Pass the locale to the quiz generation function
      userComments,
      selectedSubjects,
      includeFileReferences
    };

    console.log('Generating quiz with params:', params);
    const quiz = await generateQuiz(params);
    console.log('Quiz generated successfully');
    
    return NextResponse.json({
      ...quiz,
      model: "gpt-4o-mini" // Indicate which model was used
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    
    // Check for specific error types and provide more useful responses
    let status = 500;
    let errorMessage = error.message || 'Failed to generate quiz';
    
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
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: errorMessage,
        code: status,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        model: "gpt-4o-mini",
        timestamp: new Date().toISOString()
      },
      { status }
    );
  }
}

