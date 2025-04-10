import { NextRequest, NextResponse } from 'next/server';
import { updateSubject, deleteSubject } from '@/app/lib-server/subjectService';
import { validateToken } from '@/app/lib-server/authService';

/**
 * PUT /api/subjects/[id] - Update a subject
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Get token from header or body
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
    
    // Extract updates from the request body
    const { name, order, source } = body;
    
    // Prepare updates object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (order !== undefined) updates.order = order;
    if (source !== undefined) updates.source = source;
    
    // Update the subject
    const updatedSubject = await updateSubject(id, updates, token);
    
    return NextResponse.json(updatedSubject);
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { error: 'Failed to update subject' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subjects/[id] - Delete a subject
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get token from header or body (if available)
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    let bodyToken = null;
    try {
      // Try to parse body if present
      const body = await request.json();
      bodyToken = body.token;
    } catch (e) {
      // Body might be empty in DELETE requests
    }
    
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
    
    // Delete the subject
    await deleteSubject(id, token);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    );
  }
} 