import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/lib-server/auth/authService';
import { FileEmbeddingService } from '@/app/lib-server/FileEmbeddingService';
import { getFileContent } from '@/app/lib-server/quiz/quizService';
import { supabase, getAuthenticatedClient } from '@/app/lib-server/supabaseClient';

// Initialize services
const fileEmbeddingService = new FileEmbeddingService();

/**
 * GET /api/files/embeddings?fileId=xxx
 * Get embedding status for a file
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { userId, token } = await verifyAuth(req);
    
    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get file ID from query params
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing required parameter: fileId' },
        { status: 400 }
      );
    }
    
    // Get authenticated Supabase client
    const client = await getAuthenticatedClient(token);
    
    // Check if file exists and belongs to the user
    const { data: file, error: fileError } = await client
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();
      
    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get embedding status from file metadata
    const embeddingStatus = {
      fileId: file.id,
      fileName: file.name,
      hasEmbeddings: file.metadata?.embeddingsGenerated === true,
      isGenerating: file.metadata?.embeddingsGenerating === true,
      error: file.metadata?.embeddingsError,
      count: file.metadata?.embeddingsCount || 0,
      generatedAt: file.metadata?.embeddingsGeneratedAt
    };
    
    return NextResponse.json(embeddingStatus);
  } catch (error) {
    console.error('Error getting embedding status:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to get embedding status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files/embeddings
 * Generate embeddings for a file
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { userId, token } = await verifyAuth(req);
    
    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { fileId } = body;
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing required parameter: fileId' },
        { status: 400 }
      );
    }
    
    // Get authenticated Supabase client
    const client = await getAuthenticatedClient(token);
    
    // Check if file exists and belongs to the user
    const { data: file, error: fileError } = await client
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();
      
    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      );
    }
    
    // Check if embeddings are already being generated
    if (file.metadata?.embeddingsGenerating === true) {
      return NextResponse.json({
        message: 'Embeddings are already being generated for this file',
        status: 'processing'
      });
    }
    
    // Get file content
    const { content: fileContent } = await getFileContent(fileId, token);
    
    if (!fileContent || fileContent.length < 50) {
      return NextResponse.json(
        { error: 'File has insufficient content for embedding generation' },
        { status: 400 }
      );
    }
    
    // Update file metadata to indicate embeddings are being generated
    await client
      .from('files')
      .update({
        metadata: {
          ...file.metadata,
          embeddingsGenerating: true,
          embeddingsGenerated: false,
          embeddingsError: null
        }
      })
      .eq('id', fileId);
    
    // Start embedding generation in background
    generateEmbeddingsAsync(file, fileContent, token);
    
    return NextResponse.json({
      message: 'Embedding generation started',
      status: 'processing'
    });
  } catch (error) {
    console.error('Error starting embedding generation:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to start embedding generation' },
      { status: 500 }
    );
  }
}

/**
 * Generate embeddings asynchronously (non-blocking)
 */
async function generateEmbeddingsAsync(file: any, fileContent: string, token: string) {
  try {
    // Delete any existing embeddings for this file first
    const client = await getAuthenticatedClient(token);
    await client
      .from('file_embeddings')
      .delete()
      .eq('file_id', file.id);
    
    // Use the FileEmbeddingService to generate embeddings
    await fileEmbeddingService.generateEmbeddingsInBackground(file, fileContent, token);
  } catch (error) {
    console.error('Error in generateEmbeddingsAsync:', error);
    // Error handling is already implemented in the FileEmbeddingService
  }
} 