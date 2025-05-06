'use server';

import { supabase } from '../supabaseClient';
import fs from 'fs';
import path from 'path';

/**
 * Runs a SQL migration script on the database
 * @param filePath Path to the SQL file relative to the project root
 * @returns Promise resolving to success status
 */
export async function runMigration(filePath: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Running migration from file: ${filePath}`);
    
    // Read the SQL file
    const fullPath = path.join(process.cwd(), filePath);
    const sql = fs.readFileSync(fullPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('run_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error running migration:', error);
      return { 
        success: false, 
        message: `Migration failed: ${error.message}`
      };
    }
    
    console.log(`Migration successful: ${filePath}`);
    return { 
      success: true, 
      message: `Migration completed successfully: ${filePath}`
    };
  } catch (error: any) {
    console.error('Error in runMigration:', error);
    return { 
      success: false, 
      message: `Migration failed: ${error.message || 'Unknown error'}`
    };
  }
} 