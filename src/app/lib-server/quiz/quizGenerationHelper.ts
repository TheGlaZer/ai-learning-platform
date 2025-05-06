'use server';

import { supabase, getAuthenticatedClient } from '../supabaseClient';
import { AIServiceOptions } from '../ai/AIService';
import { AIConfig } from '../ai/AIConfig';
import { AIServiceFactory, AIProviderType } from '../ai/AIServiceFactory';
import { AIService } from '../ai/AIService';
import { FileEmbeddingService } from '../FileEmbeddingService';
import { detectLanguage } from '@/app/utils/fileProcessing/textProcessing';
import { createClient } from '@supabase/supabase-js';
import { getPatternById, formatPatternForPrompt } from '../patternService';
import { Pattern } from '@/app/models/pattern';

/**
 * Updates the usage count for a pattern
 */
export async function updatePatternUsageCount(patternId: string, token?: string): Promise<void> {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    
    await client.rpc('increment_pattern_usage', {
      pattern_id: patternId
    });
  } catch (error) {
    console.warn('Error updating pattern usage count:', error);
    // Non-critical error, can be ignored
  }
}

/**
 * Fetch and format exam patterns for quiz generation
 */
export async function fetchExamPatterns(patternIds: string[], token?: string): Promise<string> {
  if (!patternIds || patternIds.length === 0) return '';
  
  try {
    console.log(`Fetching ${patternIds.length} exam patterns for quiz generation`);
    
    const patterns: Pattern[] = [];
    for (const patternId of patternIds) {
      const pattern = await getPatternById(patternId, token);
      if (pattern) {
        patterns.push(pattern);
        
        // Increment usage count for the pattern
        await updatePatternUsageCount(patternId, token);
      }
    }
    
    if (patterns.length > 0) {
      const patternPrompt = formatPatternForPrompt(patterns);
      console.log('Successfully incorporated exam patterns into quiz generation');
      return patternPrompt;
    }
  } catch (patternError) {
    console.error('Error fetching patterns:', patternError);
  }
  
  return '';
}

/**
 * Get previous questions to avoid repetition
 */
export async function getPreviousQuestions(
  fileId: string | null, 
  workspaceId: string,
  token?: string
): Promise<string[]> {
  const previousQuestionTexts: string[] = [];
  
  try {
    console.log('Fetching previous quizzes to avoid question repetition');
    const client = token ? await getAuthenticatedClient(token) : supabase;
    
    // Build base query
    let query = client
      .from('quizzes')
      .select('questions')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5); // Get the most recent 5 quizzes
    
    // Apply file filter only if fileId is provided
    if (fileId) {
      query = query.eq('file_id', fileId);
    }
    
    const { data: previousQuizzes, error } = await query;
    
    if (error) {
      console.warn(`Could not fetch previous quizzes: ${error.message}`);
    } else if (previousQuizzes && previousQuizzes.length > 0) {
      // Extract just the question text from each question
      previousQuizzes.forEach(quiz => {
        if (quiz.questions && Array.isArray(quiz.questions)) {
          quiz.questions.forEach(q => {
            if (q.question) {
              // Add original question (most important)
              previousQuestionTexts.push(q.question);
              
              // For Hebrew/Arabic and other RTL languages, special handling
              const isRTL = /[\u0590-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFF\uFE70-\uFEFC]/.test(q.question);
              
              if (isRTL) {
                // For RTL languages, add multiple variations to ensure the AI understands
                // Add with question marks removed (common in Hebrew/Arabic questions)
                const noQuestionMarks = q.question.replace(/[?؟]/g, '');
                previousQuestionTexts.push(noQuestionMarks);
                
                // Add with common prefixes that might be used in rephrasing
                // Hebrew prefixes for "what is", "what are", etc.
                const hebrewPrefixes = ['מהו', 'מהי', 'מהם', 'מהן', 'איך', 'כיצד', 'מדוע', 'למה'];
                for (const prefix of hebrewPrefixes) {
                  if (q.question.includes(prefix)) {
                    // Extract key part of the question after the prefix
                    const keyPart = q.question.split(prefix)[1]?.trim();
                    if (keyPart && keyPart.length > 10) {
                      previousQuestionTexts.push(keyPart);
                    }
                  }
                }
              } else {
                // For Latin script languages
                // Clean and normalize the question (remove punctuation, excess spaces, etc.)
                const normalizedQuestion = q.question
                  .trim()
                  .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                  .replace(/[?"'.,:;!]/g, ''); // Remove common punctuation
                
                // Extract key parts of the question
                const words = normalizedQuestion.split(' ').filter((word: string) => word.length > 3);
                if (words.length >= 5) {
                  // Add key parts of longer questions to further prevent similar questions
                  const keyParts = `Key concepts: ${words.slice(0, 5).join(' ')}`;
                  previousQuestionTexts.push(keyParts);
                }
              }
            }
          });
        }
      });
      
      const sourceText = fileId ? "for the file" : "across the workspace";
      console.log(`Extracted ${previousQuestionTexts.length} previous questions and key phrases ${sourceText} to avoid repetition`);
    }
  } catch (error) {
    console.warn('Error fetching previous quizzes:', error);
  }
  
  return previousQuestionTexts;
}

/**
 * Get subject names from subject IDs
 */
export async function getSubjectNames(subjectIds: string[], token?: string): Promise<string[]> {
  if (!subjectIds || subjectIds.length === 0) {
    return [];
  }
  
  try {
    // Get authenticated client
    const client = token ? await getAuthenticatedClient(token) : supabase;
      
    // Get subject names from IDs
    const { data: subjects, error } = await client
      .from("subjects")
      .select("name")
      .in("id", subjectIds);
      
    if (error) {
      console.warn(`Could not fetch subject names: ${error.message}`);
      return [];
    } else if (subjects) {
      const names = subjects.map(s => s.name);
      console.log(`Retrieved subject names: ${names.join(', ')}`);
      return names;
    }
  } catch (error) {
    console.warn('Error fetching subject names:', error);
  }
  
  return [];
}

/**
 * Find relevant content sections for selected subjects
 */
export async function findRelevantContentSections(
  fileId: string,
  fullContent: string,
  subjectNames: string[],
  token?: string
): Promise<string> {
  if (!subjectNames.length) return fullContent;
  
  try {
    // Check if file has embeddings
    const client = token ? await getAuthenticatedClient(token) : supabase;
    const { data, error } = await client
      .from('files')
      .select('metadata')
      .eq('id', fileId)
      .single();
      
    if (!error && data && data.metadata && data.metadata.embeddingsGenerated) {
      console.log(`File has embeddings. Attempting to find relevant sections for subjects: ${subjectNames.join(', ')}`);
      
      // Create file embedding service
      const fileEmbeddingService = new FileEmbeddingService();
      
      // Combine subject names into a query
      const subjectQuery = subjectNames.join(', ');
      
      // Find relevant sections based on subject
      const relevantSections = await fileEmbeddingService.findRelevantSectionsBySubject(
        subjectQuery,
        fileId,
        {
          threshold: 0.65,
          limit: 10,
          token
        }
      );
      
      if (relevantSections.length > 0) {
        console.log(`Found ${relevantSections.length} relevant sections for the selected subjects`);
        
        // Combine relevant sections into a single document
        // Add section markers to help the AI model understand the structure
        let combinedContent = `DOCUMENT SECTIONS RELEVANT TO: ${subjectNames.join(', ')}\n\n`;
        
        relevantSections.forEach((section, index) => {
          combinedContent += `=== SECTION ${index + 1} (Relevance: ${Math.round(section.similarity * 100)}%) ===\n`;
          combinedContent += section.content;
          combinedContent += '\n\n';
        });
        
        // Add a small sample of the original content to provide context
        const originalSample = fullContent.substring(0, 2000);
        combinedContent += `\n=== ADDITIONAL DOCUMENT CONTEXT ===\n${originalSample}\n`;
        
        console.log(`Using ${combinedContent.length} chars of relevant content instead of full document (${fullContent.length} chars)`);
        return combinedContent;
      }
    }
    
    console.log(`File does not have embeddings or no relevant sections found. Using full document content.`);
  } catch (error) {
    console.warn('Error finding relevant sections:', error);
  }
  
  return fullContent;
}

/**
 * Create AI service based on configuration
 */
export async function createAIService(aiProvider?: string): { 
  aiService: AIService, 
  aiOptions: AIServiceOptions 
} {
  // Get AI configuration
  const aiConfig = AIConfig.getInstance();
  
  // Override the default provider if specified in params
  let aiService: AIService;
  if (aiProvider) {
    console.log(`Using specified AI provider: ${aiProvider}`);
    aiService = AIServiceFactory.createService(aiProvider as AIProviderType);
    
    // Configure the model based on provider
    if (aiProvider === 'anthropic') {
      // Use the model configured in AIConfig instead of hardcoding it
      const configModel = aiConfig.getFeatureConfig('quiz_generation')?.model || 'claude-3-5-haiku-20241022';
      (aiService as any).setDefaultModel(configModel);
    } else if (aiProvider === 'openai') {
      (aiService as any).setDefaultModel('gpt-4o-mini');
    }
  } else {
    // Use the default service from config
    aiService = aiConfig.getServiceForFeature('quiz_generation');
  }
  
  // Get configuration details for logging
  const featureConfig = aiConfig.getFeatureConfig('quiz_generation');
  console.log(`Selected AI service: ${featureConfig?.provider}, model: ${featureConfig?.model || 'default'}`);
  
  // Create AI options
  const aiOptions: AIServiceOptions = {
    temperature: 0.7,
    maxTokens: 2000,
    model: aiProvider === 'anthropic' 
      ? (featureConfig?.model || 'claude-3-5-haiku-20241022') 
      : 'gpt-4o-mini', // Use config model instead of hardcoded value
  };
  
  return { aiService, aiOptions };
}

/**
 * Update file's detected language or get from metadata
 */
export async function updateFileLanguage(
  file: any, 
  content: string, 
  fileId: string, 
  token?: string
): Promise<string> {
  // Get the detected language from file metadata or detect it from content
  let detectedLanguage = file.metadata?.detectedLanguage;
  
  // If language isn't in metadata, detect it and save for future use
  if (!detectedLanguage) {
    detectedLanguage = detectLanguage(content);
    console.log(`Language detected from content: ${detectedLanguage}`);
    
    // Update the file metadata with the detected language for future use
    try {
      // Create authenticated client using the same token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      const updateClient = token 
        ? createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
          })
        : supabase;
          
      await updateClient
        .from("files")
        .update({
          metadata: {
            ...file.metadata,
            detectedLanguage,
          },
        })
        .eq("id", fileId);
      
      console.log(`Updated file metadata with detected language: ${detectedLanguage}`);
    } catch (updateError) {
      console.warn(`Failed to update file metadata with language: ${updateError}`);
    }
  } else {
    console.log(`Using language from file metadata: ${detectedLanguage}`);
  }
  
  return detectedLanguage;
} 