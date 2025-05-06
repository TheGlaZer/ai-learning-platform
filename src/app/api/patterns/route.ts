import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/lib-server/auth/auth';
import { supabase, getAuthenticatedClient } from '@/app/lib-server/supabaseClient';
import { 
  getPatternsByWorkspace, 
  getPatternsByPastExam, 
  getPatternById,
  createPattern,
  updatePattern,
  deletePattern,
  generatePatternForPastExam
} from '@/app/lib-server/patternService';

/**
 * GET handler for fetching patterns
 * Query params:
 * - workspaceId: optional, to get patterns for a specific workspace
 * - pastExamId: optional, to get patterns for a specific past exam
 * - id: optional, to get a specific pattern by ID
 */
export async function GET(req: Request) {
  try {
    // Extract the authorization token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing authentication token' },
        { status: 401 }
      );
    }

    // Authenticate the request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || 'Unauthorized: Unable to authenticate user' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');
    const pastExamId = url.searchParams.get('pastExamId');
    const id = url.searchParams.get('id');
    
    // Get patterns based on query parameters
    if (id) {
      // Get a specific pattern by ID
      const pattern = await getPatternById(id, token);
      if (!pattern) {
        return NextResponse.json(
          { error: 'Pattern not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(pattern);
    } else if (pastExamId) {
      // Get patterns for a specific past exam
      const patterns = await getPatternsByPastExam(pastExamId, token);
      return NextResponse.json(patterns);
    } else if (workspaceId) {
      // Get patterns for a specific workspace
      const patterns = await getPatternsByWorkspace(workspaceId, token);
      return NextResponse.json(patterns);
    } else {
      return NextResponse.json(
        { error: 'Missing query parameters: workspaceId, pastExamId, or id' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching patterns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating patterns or generating patterns for past exams
 * Request body:
 * - pattern: Pattern object to create
 * OR
 * - generateFor: 'pastExam'
 * - pastExamId: ID of the past exam to generate pattern for
 * - workspaceId: ID of the workspace
 */
export async function POST(req: Request) {
  try {
    // Extract the authorization token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing authentication token' },
        { status: 401 }
      );
    }

    // Authenticate the request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || 'Unauthorized: Unable to authenticate user' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    if (body.generateFor === 'pastExam') {
      // Generate pattern for a past exam
      const { pastExamId, workspaceId } = body;
      
      if (!pastExamId || !workspaceId) {
        return NextResponse.json(
          { error: 'Missing required fields: pastExamId or workspaceId' },
          { status: 400 }
        );
      }
      
      // Get the past exam
      const client = await getAuthenticatedClient(token);
      const { data: pastExam, error: examError } = await client
        .from('past_exams')
        .select('*')
        .eq('id', pastExamId)
        .eq('workspace_id', workspaceId)
        .single();
      
      if (examError || !pastExam) {
        console.error('Error fetching past exam:', examError);
        return NextResponse.json(
          { error: 'Past exam not found' },
          { status: 404 }
        );
      }
      
      // Generate pattern
      const pattern = await generatePatternForPastExam(pastExam, userId, workspaceId, token);
      
      return NextResponse.json(pattern);
    } else {
      // Create a new pattern
      const { pattern } = body;
      
      if (!pattern) {
        return NextResponse.json(
          { error: 'Missing required field: pattern' },
          { status: 400 }
        );
      }
      
      // Ensure pattern has required fields
      if (!pattern.past_exam_id || !pattern.workspace_id) {
        return NextResponse.json(
          { error: 'Missing required fields in pattern: past_exam_id or workspace_id' },
          { status: 400 }
        );
      }
      
      // Set user ID
      pattern.user_id = userId;
      
      // Create pattern
      const newPattern = await createPattern(pattern, token);
      
      return NextResponse.json(newPattern);
    }
  } catch (error: any) {
    console.error('Error creating pattern:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create pattern' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating patterns
 * Request body:
 * - id: ID of the pattern to update
 * - updates: Object with fields to update
 */
export async function PATCH(req: Request) {
  try {
    // Extract the authorization token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing authentication token' },
        { status: 401 }
      );
    }

    // Authenticate the request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || 'Unauthorized: Unable to authenticate user' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { id, updates } = await req.json();
    
    if (!id || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: id or updates' },
        { status: 400 }
      );
    }
    
    // Get the pattern to verify ownership
    const pattern = await getPatternById(id, token);
    
    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      );
    }
    
    if (pattern.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to update this pattern' },
        { status: 403 }
      );
    }
    
    // Update the pattern
    const updatedPattern = await updatePattern(id, updates, token);
    
    return NextResponse.json(updatedPattern);
  } catch (error: any) {
    console.error('Error updating pattern:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update pattern' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting patterns
 * Query params:
 * - id: ID of the pattern to delete
 */
export async function DELETE(req: Request) {
  try {
    // Extract the authorization token from request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing authentication token' },
        { status: 401 }
      );
    }

    // Authenticate the request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || 'Unauthorized: Unable to authenticate user' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required query parameter: id' },
        { status: 400 }
      );
    }
    
    // Get the pattern to verify ownership
    const pattern = await getPatternById(id, token);
    
    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      );
    }
    
    if (pattern.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to delete this pattern' },
        { status: 403 }
      );
    }
    
    // Delete the pattern
    await deletePattern(id, token);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting pattern:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete pattern' },
      { status: 500 }
    );
  }
} 