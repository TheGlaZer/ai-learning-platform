import { NextRequest, NextResponse } from 'next/server';
import { 
  createSubject, 
  getWorkspaceSubjects 
} from '@/app/lib-server/subjectService';
import { validateToken, extractToken } from '@/app/lib-server/authService';
import { Subject } from '@/app/models/subject';

/**
 * GET /api/subjects - Get subjects for a workspace
 */
export async function GET(
  request: NextRequest
) {
  try {
    // Get the workspaceId from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    // Extract token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    // Get subjects for the workspace with the token
    const subjects = await getWorkspaceSubjects(workspaceId, token || undefined);

    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subjects - Create a new subject
 */
export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();
    
    // Get token from request header or body
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const bodyToken = body.token;
    const token = headerToken || bodyToken;
    
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
    
    // Create a new subject from the request body
    const { workspaceId, userId, name, source, order } = body;
    
    if (!workspaceId || !userId || !name) {
      return NextResponse.json(
        { error: 'Workspace ID, user ID, and name are required' },
        { status: 400 }
      );
    }
    
    const subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'> = {
      workspaceId,
      userId,
      name,
      source,
      order
    };
    
    const newSubject = await createSubject(subject, token);
    
    return NextResponse.json(newSubject);
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    );
  }
} 