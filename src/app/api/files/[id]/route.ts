import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, updateFileMetadata } from '@/app/lib-server/filesService';
import { validateToken } from '@/app/lib-server/authService';

// DELETE method to delete a file by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate Authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const validatedToken = await validateToken(token);
    
    if (!validatedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = params;
    // Pass the request to the service for further validation and processing
    const result = await deleteFile(id);

    if (!result) {
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/files/[id]:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the file' },
      { status: 500 }
    );
  }
}

// PATCH method to update file metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate Authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const validatedToken = await validateToken(token);
    
    if (!validatedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = params;
    const updates = await request.json();
    
    // Validate the updates
    if (!updates) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }
    
    // Pass the updates to the service layer
    const success = await updateFileMetadata(id, updates);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update file metadata' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/files/[id]:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the file metadata' },
      { status: 500 }
    );
  }
} 