import { NextResponse } from 'next/server';
import { extractToken, validateToken } from '@/app/lib-server/authService';
import { getUserPerformanceAnalytics } from '@/app/lib-server/quizAnswerService';

export const dynamic = 'force-dynamic'; // This ensures the route is not statically optimized
export const maxDuration = 30; // 30 seconds
export const runtime = 'nodejs'; // Force Node.js runtime for this API route

// Get user performance analytics
export async function GET(req: Request) {
  try {
    console.log('User performance analytics endpoint hit');
    const token = await extractToken(req);
    
    if (!token) {
      console.log('No authentication token found in request');
      return NextResponse.json({ error: 'Authentication token is missing. Please log in again.' }, { status: 401 });
    }
    
    // Validate the token
    const tokenUserId = await validateToken(token);
    if (!tokenUserId) {
      console.log('Invalid or expired authentication token');
      return NextResponse.json({ error: 'Authentication token is invalid or expired. Please log in again.' }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const workspaceId = url.searchParams.get('workspaceId');
    
    // Validate required parameters
    if (!userId || !workspaceId) {
      console.log('Missing required parameters:', { userId, workspaceId });
      return NextResponse.json(
        { error: 'Missing required parameters: userId and workspaceId are required' },
        { status: 400 }
      );
    }
    
    // Validate that the authenticated user matches the requested userId
    if (tokenUserId !== userId) {
      console.log('User ID mismatch:', { tokenUserId, requestedUserId: userId });
      return NextResponse.json(
        { error: 'You do not have permission to access this data' },
        { status: 403 }
      );
    }
    
    // Validate UUID format for workspaceId (userId might not be UUID depending on auth system)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workspaceId)) {
      console.error('Invalid UUID format for workspaceId:', workspaceId);
      return NextResponse.json(
        { error: 'Invalid UUID format for workspaceId' },
        { status: 400 }
      );
    }

    console.log('Getting performance analytics for:', { userId, workspaceId });
    const analytics = await getUserPerformanceAnalytics(userId, workspaceId, token);
    console.log('Performance analytics retrieved successfully');
    
    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Error getting performance analytics:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get performance analytics',
        details: error.stack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 