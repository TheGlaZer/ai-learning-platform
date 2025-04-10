import { NextRequest, NextResponse } from 'next/server';
import { generateQuiz, getQuizById, getQuizzesByWorkspace } from '@/app/lib-server/quizService';
import { QuizGenerationParams } from '@/app/models/quiz';
import { extractToken } from '@/app/lib-server/authService';
import { supabase } from '@/app/lib-server/supabaseClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout for long-running operations
export const runtime = 'nodejs'; // Force Node.js runtime for this API route

// Get quizzes for a workspace
export async function GET(req: Request) {
  try {
    console.log('Quizzes GET route hit!');
    
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');
    
    if (!workspaceId) {
      return NextResponse.json({ 
        error: 'Missing workspaceId parameter'
      }, { status: 400 });
    }
    
    // Extract token from request
    const token = await extractToken(req);
    
    // Get quizzes with authenticated client
    const quizzes = await getQuizzesByWorkspace(workspaceId, token || undefined);
    
    return NextResponse.json(quizzes);
  } catch (error: any) {
    console.error('Error in quizzes GET route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Generate a quiz
export async function POST(req: Request) {
  try {
    console.log('Simplified quizzes POST route hit!');
    return NextResponse.json({ message: 'Simplified POST handler works' });
  } catch (error: any) {
    console.error('Error in simplified quizzes POST route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

