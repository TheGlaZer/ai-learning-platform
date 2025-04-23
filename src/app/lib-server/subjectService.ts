'use server';

import { supabase, getAuthenticatedClient } from './supabaseClient';
import { Subject, SubjectGenerationParams } from '@/app/models/subject';
import { AIServiceFactory } from './ai/AIServiceFactory';
import { FileMetadata } from '@/app/models/file';
import { extractTextFromFile } from '@/app/utils/fileProcessing/index';
import { AIServiceOptions } from './ai/AIService';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { detectLanguage } from '@/app/utils/fileProcessing/textProcessing';
import { getFileContent } from './quizService';
import { AIConfig } from './ai/AIConfig';

// Define the database schema types
interface Database {
  public: {
    Tables: {
      subjects: {
        Row: any;
        Insert: Omit<any, 'id' | 'created_at' | 'updated_at'>;
      };
      files: {
        Row: FileMetadata;
        Insert: Omit<FileMetadata, 'id' | 'created_at'>;
      };
    };
  };
}

/**
 * Helper function to get MIME type from file extension
 */
function getMimeTypeFromExtension(extension?: string): string {
  if (!extension) return 'application/octet-stream';
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'json': 'application/json'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Helper function to create an authenticated Supabase client
 */
function createAuthenticatedClient(token?: string): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  // If token is provided, create an authenticated client
  if (token) {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  
  // Otherwise, create a standard client
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Creates a subject in the database and returns the result
 * Will check for duplicates by name (case-insensitive) before creating
 */
export const createSubject = async (subject: Subject, token?: string): Promise<Subject> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  // First check if a subject with the same name already exists in this workspace
  const { data: existingSubjects, error: checkError } = await client
    .from('subjects')
    .select('*')
    .eq('workspace_id', subject.workspaceId)
    .ilike('name', subject.name.trim())
    .limit(1);
    
  if (checkError) {
    console.error('Error checking for existing subjects:', checkError);
    throw checkError;
  }
  
  // If a subject with the same name already exists, return it instead of creating a duplicate
  if (existingSubjects && existingSubjects.length > 0) {
    console.log(`Subject with name "${subject.name}" already exists in workspace ${subject.workspaceId}, returning existing one`);
    
    const existingSubject = existingSubjects[0];
    return {
      id: existingSubject.id,
      workspaceId: existingSubject.workspace_id,
      userId: existingSubject.user_id,
      name: existingSubject.name,
      source: existingSubject.source,
      order: existingSubject.order,
      createdAt: existingSubject.created_at,
      updatedAt: existingSubject.updated_at,
    };
  }
  
  // Create the new subject
  const { data, error } = await client
    .from('subjects')
    .insert([
      {
        workspace_id: subject.workspaceId,
        user_id: subject.userId,
        name: subject.name,
        source: subject.source || 'manual',
        order: subject.order
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error creating subject:', error);
    throw error;
  }

  // Transform the data to match our Subject interface
  return {
    id: data.id,
    workspaceId: data.workspace_id,
    userId: data.user_id,
    name: data.name,
    source: data.source,
    order: data.order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Updates a subject in the database and returns the updated result
 */
export const updateSubject = async (id: string, updates: Partial<Subject>, token?: string): Promise<Subject> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  // Convert the updates to the database column names
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.order !== undefined) dbUpdates.order = updates.order;
  if (updates.source !== undefined) dbUpdates.source = updates.source;

  const { data, error } = await client
    .from('subjects')
    .update(dbUpdates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating subject:', error);
    throw error;
  }

  // Transform the data to match our Subject interface
  return {
    id: data.id,
    workspaceId: data.workspace_id,
    userId: data.user_id,
    name: data.name,
    source: data.source,
    order: data.order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Deletes a subject from the database
 */
export const deleteSubject = async (id: string, token?: string): Promise<void> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  const { error } = await client
    .from('subjects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
};

/**
 * Gets subjects by workspace ID
 */
export const getWorkspaceSubjects = async (workspaceId: string, token?: string): Promise<Subject[]> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  const { data, error } = await client
    .from('subjects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching subjects for workspace:', error);
    throw error;
  }

  // Transform the data to match our Subject interface
  return (data || []).map((subject) => ({
    id: subject.id,
    workspaceId: subject.workspace_id,
    userId: subject.user_id,
    name: subject.name,
    source: subject.source,
    order: subject.order,
    createdAt: subject.created_at,
    updatedAt: subject.updated_at,
  }));
};

/**
 * Generates subjects from a file and saves them to the database
 * Will maintain existing subjects and only add new ones
 */
export const generateSubjectsFromFile = async (params: SubjectGenerationParams): Promise<{
  existingSubjects: Subject[],
  newSubjects: Subject[],
  debug?: { 
    aiResponse?: string,
    parsedSubjects?: any[],
    existingSubjectNames?: string[],
    unrelatedContent?: boolean,
    unrelatedMessage?: string
  },
  unrelatedContent?: boolean,
  unrelatedMessage?: string
}> => {
  console.log(`Starting subject generation with params:`, params);
  
  try {
    // First, get existing subjects for this workspace
    const existingSubjects = await getWorkspaceSubjects(params.workspaceId, params.token);
    const existingSubjectNames = new Set(existingSubjects.map(s => s.name.toLowerCase().trim()));
    
    console.log(`Found ${existingSubjects.length} existing subjects in workspace`);
    
    // Get file content using the shared getFileContent function
    console.log(`Fetching content for file ID: ${params.fileId}`);
    const { file, content } = await getFileContent(params.fileId, params.token);
    console.log(`Successfully retrieved file: ${file.name}, content length: ${content.length} chars`);
    
    // Check if we have enough content to generate subjects
    if (content.trim().length < 50) {
      throw new Error('Not enough text content extracted from the file to generate subjects.');
    }
    
    // Check if the content is very large and log a warning
    const isLargeFile = content.length > 500000; // ~ 125K tokens
    if (isLargeFile) {
      console.log(`WARNING: Very large file content (${content.length} chars). Processing may take longer and will be split into chunks.`);
    }
    
    // Generate subjects using AI service
    const aiConfig = AIConfig.getInstance();
    const aiService = aiConfig.getServiceForFeature('subject_extraction');
    
    // Get configuration details for logging
    const featureConfig = aiConfig.getFeatureConfig('subject_extraction');
    console.log(`Selected AI service: ${featureConfig?.provider}, model: ${featureConfig?.model || 'default'}`);
    
    // Get language preference or fall back to detected language
    let preferredLanguage = params.locale;
    let detectedLanguage = file.metadata?.detectedLanguage;
    
    console.log(`User locale from request: ${preferredLanguage || 'not provided'}`);
    console.log(`Detected language from file: ${detectedLanguage || 'not detected'}`);
    
    // Determine which language to use for generation
    // Priority: 1. User locale (if provided), 2. Detected language, 3. Default to 'en'
    const languageForGeneration = preferredLanguage || detectedLanguage || 'en';
    
    console.log(`Using language for subject generation: ${languageForGeneration}`);
    
    // Pass existing subjects to the AI service
    const aiOptions: AIServiceOptions = {
      temperature: 0.3,
      maxTokens: 2000,
      language: languageForGeneration,
      model: 'gpt-4o-mini',
      // Pass simplified subject list with just names to the AI
      existingSubjects: existingSubjects.map(subject => ({ name: subject.name })),
      // Custom options for subject generation
      countRange: params.countRange || 'medium', // Default to medium (10-15 subjects)
      specificity: params.specificity || 'general' // Default to general subjects
    };
    
    console.log(`Sending request to AI service for subject generation using model: gpt-4o-mini in language: ${languageForGeneration}`);
    console.log(`Including ${existingSubjects.length} existing subjects in the prompt`);
    console.log(`Custom options: countRange=${aiOptions.countRange}, specificity=${aiOptions.specificity}`);
    
    const response = await aiService.generateSubjects(content, aiOptions);
    
    console.log('Received AI response:', {
      modelUsed: response.modelUsed,
      tokenCount: response.tokenCount,
      contentLength: response.content.length,
    });
    
    // For debugging: Log the full AI response content
    console.log('=============== FULL AI RESPONSE START ===============');
    console.log(response.content);
    console.log('=============== FULL AI RESPONSE END ===============');
    
    // Debug info to be returned
    const debugInfo: any = {
      aiResponse: response.content
    };
    
    // Parse the response to get subjects
    // The response is expected to be a JSON array of subjects
    let generatedSubjects: Subject[] = [];
    try {
      // Clean the response content by removing any markdown formatting
      let cleanedContent = response.content;
      
      // Remove markdown code blocks if present
      cleanedContent = cleanedContent.replace(/```json\s*/g, '');
      cleanedContent = cleanedContent.replace(/```\s*/g, '');
      
      // Trim whitespace
      cleanedContent = cleanedContent.trim();
      
      console.log('Cleaned content for parsing:', cleanedContent.substring(0, 100) + '...');
      
      // Parse the JSON
      const parsedSubjects = JSON.parse(cleanedContent);
      
      // Ensure the parsed content is an array of subjects
      if (!Array.isArray(parsedSubjects)) {
        throw new Error('AI response is not a valid array of subjects');
      }
      
      // Check for special status response (unrelated content)
      if (parsedSubjects.length === 1 && parsedSubjects[0].status === 'unrelated_content') {
        console.log('AI detected unrelated content:', parsedSubjects[0].message);
        debugInfo.unrelatedContent = true;
        debugInfo.unrelatedMessage = parsedSubjects[0].message;
        
        // Return with special status to indicate unrelated content
        return {
          existingSubjects: existingSubjects,
          newSubjects: [],
          debug: debugInfo,
          unrelatedContent: true,
          unrelatedMessage: parsedSubjects[0].message
        };
      }
      
      // Store parsed subjects for debugging
      debugInfo.parsedSubjects = parsedSubjects;
      debugInfo.existingSubjectNames = Array.from(existingSubjectNames);
      
      // Helper function to check if names are too similar (additional safeguard)
      const areTooSimilar = (name1: string, name2: string): boolean => {
        const normalizedName1 = name1.toLowerCase().trim();
        const normalizedName2 = name2.toLowerCase().trim();
        
        // Check for exact match after normalization
        if (normalizedName1 === normalizedName2) return true;
        
        // Check if one is a subset of the other
        if (normalizedName1.includes(normalizedName2) || normalizedName2.includes(normalizedName1)) return true;
        
        return false;
      };
      
      // As an extra safety measure, filter out any subjects that might still match existing ones
      // (although the AI should have already excluded them)
      generatedSubjects = parsedSubjects
        .filter(subject => subject && typeof subject === 'object' && subject.name)
        .filter(subject => {
          // Check against all existing subjects for similarity
          for (const existingName of Array.from(existingSubjectNames)) {
            if (areTooSimilar(subject.name, existingName)) {
              console.log(`Filtered out similar subject: "${subject.name}" (similar to existing "${existingName}")`);
              return false;
            }
          }
          return true;
        })
        .map(subject => ({
          workspaceId: params.workspaceId,
          userId: params.userId,
          name: subject.name,
          source: 'auto',
          // Add a field to indicate if this was processed in chunks (for large files)
          processedInChunks: isLargeFile
        }));
      
      console.log(`Successfully parsed ${parsedSubjects.length} subjects from AI response, ${generatedSubjects.length} are new`);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI response content:', response.content.substring(0, 500) + '...');
      throw new Error('Failed to parse AI response into valid subjects');
    }
    
    // If no new subjects, return the existing ones
    if (generatedSubjects.length === 0) {
      console.log('No new subjects found, returning existing subjects');
      return {
        existingSubjects: existingSubjects,
        newSubjects: [],
        debug: debugInfo,
        unrelatedContent: false,
        unrelatedMessage: undefined
      };
    }
    
    // Save the new subjects to the database
    const savedSubjects: Subject[] = [];
    
    // Get max order of existing subjects to ensure new ones are added at the end
    const maxOrder = existingSubjects.length > 0
      ? Math.max(...existingSubjects.map(s => s.order || 0))
      : -1;
    
    for (let i = 0; i < generatedSubjects.length; i++) {
      const subject = generatedSubjects[i];
      
      const savedSubject = await createSubject({
        ...subject,
        order: maxOrder + i + 1, // Ensure new subjects are at the end in order
      }, params.token);
      
      // Add processedInChunks property to the savedSubject to pass it back
      if (isLargeFile) {
        Object.assign(savedSubject, { processedInChunks: true });
      }
      
      savedSubjects.push(savedSubject);
    }
    
    // Return existing subjects and new subjects as separate arrays
    return {
      existingSubjects: existingSubjects,
      newSubjects: savedSubjects,
      debug: debugInfo,
      unrelatedContent: false,
      unrelatedMessage: undefined
    };
  } catch (error) {
    console.error('Error in generateSubjectsFromFile:', error);
    throw error;
  }
}; 