'use server';

import { NextRequest, NextResponse } from 'next/server';
import { PostgresVectorSearch } from '@/app/lib-server/vectorSearch/PostgresVectorSearch';
import { verifyAuth } from '@/app/lib-server/auth/authService';
import { SearchOptions } from '@/app/lib-server/vectorSearch/VectorSearchService';

/**
 * API endpoint for vector search operations
 * This route provides semantic search capabilities across different content types
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.userId || !authResult.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { query, contentType, options } = body;
    
    // Validate required parameters
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    if (!contentType) {
      return NextResponse.json({ error: 'Content type is required' }, { status: 400 });
    }
    
    // Valid content types
    const validContentTypes = ['subjects', 'files', 'quiz_questions'];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json({ 
        error: `Invalid content type. Valid options are: ${validContentTypes.join(', ')}` 
      }, { status: 400 });
    }
    
    // Create search options
    const searchOptions: SearchOptions = {
      limit: options?.limit || 10,
      threshold: options?.threshold || 0.7,
      filters: options?.filters || {},
      includeMetadata: options?.includeMetadata || false
    };
    
    // Create an authenticated search service
    const vectorSearch = await PostgresVectorSearch.createAuthenticatedService(
      authResult.token
    );
    
    // Perform the search based on content type
    let results;
    switch (contentType) {
      case 'subjects':
        results = await vectorSearch.searchSubjects(query, searchOptions);
        break;
      case 'files':
        results = await vectorSearch.searchFiles(query, searchOptions);
        break;
      case 'quiz_questions':
        results = await vectorSearch.searchQuizQuestions(query, searchOptions);
        break;
      default:
        // This shouldn't happen due to validation above
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }
    
    // Return the search results
    return NextResponse.json({
      results,
      metadata: {
        query,
        contentType,
        options: searchOptions,
        resultCount: results.length
      }
    });
  } catch (error) {
    console.error('Vector search error:', error);
    return NextResponse.json({ 
      error: 'An error occurred during the search',
      details: (error as Error).message
    }, { status: 500 });
  }
} 