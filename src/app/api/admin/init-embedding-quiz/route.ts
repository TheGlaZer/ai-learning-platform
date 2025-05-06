import { NextRequest, NextResponse } from 'next/server';
import { runMigration } from '@/app/lib-server/db/runMigration';
import { verifyAuth } from '@/app/lib-server/auth/authService';
import { supabase } from '@/app/lib-server/supabaseClient';

/**
 * POST /api/admin/init-embedding-quiz
 * Admin-only endpoint to initialize the embedding-based quiz feature
 * Runs database migrations needed for the feature
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin (by checking role in user record)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authResult.userId)
      .single();
    
    // Accept various admin role naming conventions
    const isAdmin = 
      !userError && 
      userData && 
      typeof userData.role === 'string' && 
      (userData.role.toLowerCase().includes('admin') || 
       userData.role === 'owner' || 
       userData.role === 'superuser');
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Run migrations in sequence
    console.log('Initializing embedding-based quiz feature...');
    
    // First, create the run_sql function if it doesn't exist
    // This is needed for the other migrations to work
    const result0 = await runMigration('src/database/migrations/create_run_sql_function.sql');
    if (!result0.success) {
      return NextResponse.json({ error: result0.message }, { status: 500 });
    }
    
    // Update file_embeddings table first
    const result1 = await runMigration('src/database/migrations/update_file_embeddings_table.sql');
    if (!result1.success) {
      return NextResponse.json({ error: result1.message }, { status: 500 });
    }
    
    // Add the search functions
    const result2 = await runMigration('src/database/migrations/embedding_based_quiz_search.sql');
    if (!result2.success) {
      return NextResponse.json({ error: result2.message }, { status: 500 });
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Embedding-based quiz feature initialized successfully',
      details: [result0.message, result1.message, result2.message]
    });
  } catch (error: any) {
    console.error('Error initializing embedding-based quiz feature:', error);
    
    return NextResponse.json(
      { error: error.message || 'Initialization failed' },
      { status: 500 }
    );
  }
} 