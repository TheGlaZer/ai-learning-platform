'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/lib-server/auth/authService';
import { PostgresVectorSearch } from '@/app/lib-server/vectorSearch/PostgresVectorSearch';
import EmbeddingManager from '@/app/lib-server/vectorEmbedding';

/**
 * Vector search API endpoint
 * Allows searching for content using vector embeddings
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const auth = await verifyAuth(req);
    if (!auth.userId || !auth.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { query, contentType, workspaceId, options = {} } = body;
    
    // Validate required parameters
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }
    
    if (!contentType) {
      return NextResponse.json({ error: 'Content type is required' }, { status: 400 });
    }
    
    // Valid content types
    const validTypes = ['subjects', 'files', 'quiz_questions'];
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type. Valid options are: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Initialize search service with authenticated client
    const searchService = await PostgresVectorSearch.createAuthenticatedService(auth.token);
    
    // Set up search options
    const searchOptions: any = {
      limit: options.limit || 10,
      threshold: options.threshold || 0.7
    };
    
    // Add workspace filter if provided
    if (workspaceId) {
      searchOptions.filters = { workspace_id: workspaceId };
    }
    
    // Perform search based on content type
    let results;
    
    switch (contentType) {
      case 'subjects':
        results = await searchService.searchSubjects(query, searchOptions);
        break;
      case 'files':
        results = await searchService.searchFiles(query, searchOptions);
        break;
      case 'quiz_questions':
        results = await searchService.searchQuizQuestions(query, searchOptions);
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }
    
    // Return search results
    return NextResponse.json({
      results: results.map(result => ({
        item: result.item,
        similarity: result.similarity
      })),
      metadata: {
        query,
        contentType,
        workspaceId,
        count: results.length
      }
    });
  } catch (error) {
    console.error('Vector search error:', error);
    return NextResponse.json(
      { error: 'Error performing vector search', details: (error as Error).message },
      { status: 500 }
    );
  }
} 