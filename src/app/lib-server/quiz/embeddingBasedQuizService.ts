'use server';

import { QuizGenerationParams } from '@/app/models/quiz';
import { validateFileSize, validateUserInput } from './quizValidation';
import { 
  getPreviousQuestions, 
  getSubjectNames, 
  createAIService,
  updateFileLanguage,
  fetchExamPatterns
} from './quizGenerationHelper';
import { storeGeneratedQuiz } from './quizStorage';
import { FileEmbeddingService } from '../FileEmbeddingService';
import EmbeddingManager from '../vectorEmbedding';
import { FileMetadata } from '@/app/models/file';
import { getAuthenticatedClient, supabase } from '../supabaseClient';
import { getFileContent } from '../file/fileContentHelper';

// Define types to replace any
type CustomError = Error & { 
  code?: string;
  originalError?: unknown;
};

// Define interfaces for metadata and chunks
interface ChunkMetadata {
  startChar?: number;
  endChar?: number;
  [key: string]: unknown; // Allow other metadata fields with unknown type
}

interface ContentChunk {
  content: string;
  similarity: number;
  metadata: ChunkMetadata;
}

// Extended AIServiceOptions interface for our specific needs
interface ExtendedAIOptions {
  language?: string;
  includeFileReferences?: boolean;
  includePastExam?: boolean;
  pastExamContent?: string;
  examPatternData?: string;
  [key: string]: unknown;
}

/**
 * Service for embedding-based quiz generation
 */
class EmbeddingBasedQuizService {
  private fileEmbeddingService: FileEmbeddingService;
  private embeddingManager = EmbeddingManager;

  constructor() {
    this.fileEmbeddingService = new FileEmbeddingService();
  }

  /**
   * Find the most relevant chunks for quiz generation based on topic and subjects
   * @param fileId File ID to search within
   * @param topic Quiz topic
   * @param selectedSubjects Selected subject names
   * @param userComments Optional user instructions
   * @param token Authentication token
   * @param workspaceId Workspace ID
   * @param numberOfQuestions Number of questions to generate
   * @returns Promise resolving to relevant content chunks
   */
  async findRelevantChunks(
    fileId: string,
    topic: string,
    selectedSubjects: string[],
    userComments?: string,
    token?: string,
    workspaceId?: string,
    numberOfQuestions: number = 10
  ): Promise<ContentChunk[]> {
    try {
      // We need to find enough chunks to generate all questions
      // Aim for 1-2 chunks per question depending on length
      const maxChunks = Math.min(numberOfQuestions * 2, 40); // Cap at 40 chunks to limit token usage
      
      // Get authenticated client if token is provided
      const client = token ? await getAuthenticatedClient(token) : supabase;
      
      // Generate embeddings in batch for all queries (topic, subjects, user instructions)
      const queries = [topic, ...selectedSubjects];
      
      // Add user comments if provided
      if (userComments && userComments.trim()) {
        queries.push(userComments);
      }
      
      console.log(`Generating embeddings for ${queries.length} queries`);
      // Generate embeddings but we don't use them directly in the simplified implementation
      await this.embeddingManager.generateBatchEmbeddings(queries);
      
      // Direct query to file_embeddings table
      // In early development, this assumes the table structure exists 
      // We'll use a simplified approach that works with both existing and new schemas
      let allChunks: ContentChunk[] = [];
      
      try {
        // First try with the simplified direct query
        const { data: fileEmbeddings, error: embeddingsError } = await client
          .from('file_embeddings')
          .select('id, file_id, content, metadata')
          .eq('file_id', fileId)
          .limit(maxChunks);
        
        if (embeddingsError) {
          console.warn('Could not query file_embeddings table directly:', embeddingsError);
          // We'll fall back to using FileEmbeddingService to extract content
        } else if (fileEmbeddings && fileEmbeddings.length > 0) {
          // Simple scoring - no need for complex database functions in early development
          const scoredChunks = fileEmbeddings.map(chunk => {
            // Calculate similarity score (simplified approach)
            const contentText = chunk.content || '';
            const topicScore = this.calculateSimpleRelevanceScore(contentText, topic);
            
            // Add subject scores
            let maxSubjectScore = 0;
            for (const subject of selectedSubjects) {
              const score = this.calculateSimpleRelevanceScore(contentText, subject);
              maxSubjectScore = Math.max(maxSubjectScore, score);
            }
            
            // Combined score (topic is most important)
            const combinedScore = (topicScore * 0.7) + (maxSubjectScore * 0.3);
            
            return {
              content: contentText,
              similarity: combinedScore,
              metadata: chunk.metadata || {}
            };
          });
          
          // Sort by score
          scoredChunks.sort((a, b) => b.similarity - a.similarity);
          allChunks = scoredChunks;
        }
      } catch (directQueryError) {
        console.warn('Error with direct embedding query, falling back to content extraction:', directQueryError);
      }
      
      // If we couldn't get chunks from embeddings, fall back to basic content extraction
      if (allChunks.length === 0) {
        console.log('No embeddings found, falling back to content extraction');
        
        // Get file content using the standard getFileContent helper
        const { content: fileContent } = await getFileContent(fileId, token); 
        
        if (fileContent) {
          // Simple content chunking
          const chunkSize = 1800;
          const overlap = 300;
          const chunks: string[] = [];
          
          // Split the content into chunks
          for (let i = 0; i < fileContent.length; i += chunkSize - overlap) {
            const chunk = fileContent.substring(i, Math.min(i + chunkSize, fileContent.length));
            chunks.push(chunk);
          }
          
          // Score chunks
          for (const chunk of chunks) {
            const topicScore = this.calculateSimpleRelevanceScore(chunk, topic);
            
            // Add subject scores
            let maxSubjectScore = 0;
            for (const subject of selectedSubjects) {
              const score = this.calculateSimpleRelevanceScore(chunk, subject);
              maxSubjectScore = Math.max(maxSubjectScore, score);
            }
            
            // Combined score
            const combinedScore = selectedSubjects.length > 0 
              ? (topicScore * 0.7) + (maxSubjectScore * 0.3)
              : topicScore;
            
            allChunks.push({
              content: chunk,
              similarity: combinedScore,
              metadata: {
                startChar: fileContent.indexOf(chunk),
                endChar: fileContent.indexOf(chunk) + chunk.length
              }
            });
          }
          
          // Sort by score
          allChunks.sort((a, b) => b.similarity - a.similarity);
        }
      }
      
      // Limit number of chunks
      console.log(`Found ${allChunks.length} content chunks for quiz generation`);
      return allChunks.slice(0, maxChunks);
      
    } catch (error) {
      console.error('Error finding relevant chunks:', error);
      return [];
    }
  }
  
  /**
   * Simple text-based relevance scoring
   * This is a fallback for early development when embeddings aren't available
   */
  private calculateSimpleRelevanceScore(text: string, query: string): number {
    if (!text || !query) return 0;
    
    const textLower = text.toLowerCase();
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Count occurrences of each query word
    let totalOccurrences = 0;
    let wordMatches = 0;
    
    for (const word of queryWords) {
      if (word.length < 3) continue; // Skip very short words
      
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = textLower.match(regex);
      
      if (matches && matches.length > 0) {
        totalOccurrences += matches.length;
        wordMatches++;
      }
    }
    
    // Calculate score based on:
    // 1. Percentage of query words that appear
    // 2. Density of occurrences (occurrences / text length)
    const wordCoverageScore = queryWords.length > 0 ? wordMatches / queryWords.length : 0;
    const densityScore = text.length > 0 ? totalOccurrences / (text.length / 100) : 0;
    
    // Combined score (normalized to 0-1 range)
    return (wordCoverageScore * 0.7) + (Math.min(densityScore, 1) * 0.3);
  }

  /**
   * Generate a quiz based on embedding-based content matching
   */
  async generateQuiz(params: QuizGenerationParams): Promise<Record<string, unknown>> {
    try {
      console.log('Generating quiz with embeddings using the following parameters:', {
        fileId: params.fileId,
        topic: params.topic,
        numberOfQuestions: params.numberOfQuestions,
        difficultyLevel: params.difficultyLevel,
        aiProvider: params.aiProvider,
        useExamPatterns: params.useExamPatterns
      });

      // 1. Validate inputs
      validateUserInput(params.userComments);
      
      // Validate required parameters
      if (!params.fileId || !params.topic || !params.userId || !params.workspaceId) {
        throw new Error('Missing required parameters for quiz generation');
      }
      
      // 2. Validate file size
      await validateFileSize(params.fileId, params.token);
      
      // 3. Get file metadata (we won't load the entire content)
      const { data: file, error: fileError } = await (params.token ? 
        await getAuthenticatedClient(params.token) : supabase)
        .from('files')
        .select('*')
        .eq('id', params.fileId)
        .single();
        
      if (fileError || !file) {
        throw new Error(`Could not find file with ID: ${params.fileId}`);
      }
      
      // 4. Handle past exam content if provided
      let pastExamContent;
      if (params.includePastExam && params.pastExamId) {
        pastExamContent = params.pastExamContent || await this.getPastExamContent(
          params.pastExamId, 
          params.userId, 
          params.token
        );
      }
      
      // 5. Get previous questions to avoid repetition
      let previousQuestionTexts = params.previousQuestions || [];
      if (!params.previousQuestions) {
        previousQuestionTexts = await getPreviousQuestions(
          params.fileId, 
          params.workspaceId, 
          params.token
        );
      }

      // 6. Get subject names if IDs are provided
      let selectedSubjectNames: string[] = [];
      if (params.selectedSubjects && params.selectedSubjects.length > 0) {
        selectedSubjectNames = await getSubjectNames(params.selectedSubjects, params.token);
      }
      
      // 7. Get exam patterns if enabled
      let examPatternPrompt = '';
      if (params.useExamPatterns && params.selectedPatternIds && params.selectedPatternIds.length > 0) {
        examPatternPrompt = await fetchExamPatterns(params.selectedPatternIds, params.token);
      }
      
      // 8. Find relevant chunks based on topic and subjects
      const relevantChunks = await this.findRelevantChunks(
        params.fileId,
        params.topic,
        selectedSubjectNames,
        params.userComments,
        params.token,
        params.workspaceId,
        params.numberOfQuestions || 10
      );
      
      // If no relevant chunks found, throw error
      if (relevantChunks.length === 0) {
        throw new Error('Could not find relevant content for quiz generation');
      }
      
      // Combine chunks into a single content string
      const contentToUse = relevantChunks
        .map(chunk => chunk.content)
        .join('\n\n');
      
      console.log(`Combined ${relevantChunks.length} chunks into ${contentToUse.length} characters for quiz generation`);
      
      // 9. Update file's detected language or get from metadata
      const detectedLanguage = await updateFileLanguage(file as FileMetadata, contentToUse, params.fileId, params.token);
      
      // 10. Determine which language to use for generation
      // Priority: 1. User locale (if provided), 2. Detected language, 3. Default to 'en'
      const languageForGeneration = params.locale || detectedLanguage || 'en';
      console.log(`Using language for quiz generation: ${languageForGeneration}`);
      
      // 11. Setup AI service and options
      const { aiService, aiOptions } = createAIService(params.aiProvider);
      
      // Add additional options to aiOptions directly
      aiOptions.language = languageForGeneration;
      aiOptions.includeFileReferences = params.includeFileReferences !== false;
      aiOptions.includePastExam = params.includePastExam;
      aiOptions.pastExamContent = pastExamContent;
      
      // If exam patterns were fetched, use them
      if (examPatternPrompt) {
        // Store exam pattern data as custom property
        (aiOptions as ExtendedAIOptions).examPatternData = examPatternPrompt;
      }
      
      // 12. Log generation details for debugging
      console.log(`Using provider ${params.aiProvider} with model ${aiOptions.model} for quiz generation`);
      console.log(`Content length: ${contentToUse.length} chars in language: ${languageForGeneration}`);
      console.log(`File references in explanations: ${params.includeFileReferences !== false ? 'enabled' : 'disabled'}`);
      console.log(`Including past exam as reference: ${params.includePastExam ? 'yes' : 'no'}`);
      
      // 13. Generate quiz using AI service
      console.log(`Sending request to AI service for quiz generation`);
      const response = await aiService.generateQuiz(
        contentToUse,
        {
          topic: params.topic,
          numberOfQuestions: params.numberOfQuestions || 10,
          difficultyLevel: params.difficultyLevel || 'medium',
          pastExamContent: pastExamContent,
          locale: languageForGeneration,
          userComments: params.userComments,
          selectedSubjects: selectedSubjectNames,
          previousQuestions: previousQuestionTexts
        }
      );
      
      console.log('Received AI response:', {
        modelUsed: response.modelUsed,
        tokenCount: response.tokenCount,
        contentLength: response.content.length,
      });
      
      // 14. Store the generated quiz
      const quiz = await storeGeneratedQuiz(
        params.userId,
        params.workspaceId,
        params.fileId,
        params.topic,
        response,
        contentToUse.substring(0, Math.min(contentToUse.length, 10000)),
        languageForGeneration,
        {
          aiProvider: params.aiProvider,
          numberOfQuestions: params.numberOfQuestions,
          userComments: params.userComments,
          selectedSubjects: selectedSubjectNames,
          includeFileReferences: params.includeFileReferences,
          useEmbeddings: true // Mark that this quiz was generated using embeddings
        },
        params.difficultyLevel || 'medium',
        previousQuestionTexts
      );
      
      return quiz;
    } catch (error: unknown) {
      const typedError = error as Error;
      console.error('Error in embedding-based quiz generation:', {
        message: typedError.message,
        stack: typedError.stack,
        originalError: (typedError as CustomError).originalError || 'No original error'
      });
      
      // Format the error message to be more user-friendly based on error type
      let userFriendlyError: CustomError;
      
      // Check for common error categories and provide specific guidance
      if (typedError.message?.includes('token limit') || 
          typedError.message?.includes('max_tokens') || 
          typedError.message?.includes('maximum allowed number of output tokens')) {
        
        userFriendlyError = new Error(
          `The AI model couldn't generate all ${params.numberOfQuestions} questions due to token limits.\n\n` +
          `Suggestions:\n` +
          `1. Reduce the number of questions (try 10-15)\n` +
          `2. Use fewer subject filters\n` +
          `3. Choose a more powerful AI model`
        ) as CustomError;
        
        userFriendlyError.code = 'TOKEN_LIMIT_ERROR';
      } 
      else if (typedError.message?.includes('Invalid JSON') || 
              typedError.message?.includes('Failed to parse AI')) {
        
        userFriendlyError = new Error(
          `There was an issue processing the AI's response for your ${params.numberOfQuestions}-question quiz.\n\n` +
          `Please try:\n` +
          `1. Generating a smaller quiz (15 questions or fewer)\n` +
          `2. Trying again (sometimes the AI response format varies)\n` +
          `3. Using a less complex topic`
        ) as CustomError;
        userFriendlyError.code = 'JSON_PARSE_ERROR';
      }
      else if (typedError.message?.includes('File size')) {
        // File size errors - keep original message as it's already descriptive
        userFriendlyError = typedError as CustomError;
        userFriendlyError.code = 'FILE_SIZE_ERROR';
      }
      else if (typedError.message?.includes('Could not find relevant content')) {
        userFriendlyError = new Error(
          `We couldn't find relevant content for "${params.topic}" in this file.\n\n` +
          `Suggestions:\n` +
          `1. Try a different topic\n` +
          `2. Ensure file content is related to the topic\n` +
          `3. Try with fewer or different subject filters`
        ) as CustomError;
        userFriendlyError.code = 'NO_RELEVANT_CONTENT_ERROR';
      }
      else {
        // Generic error with minimal processing
        userFriendlyError = new Error(
          `Quiz generation failed: ${typedError.message}`
        ) as CustomError;
      }
      
      // Preserve the original error for debugging
      userFriendlyError.originalError = typedError;
      
      throw userFriendlyError;
    }
  }

  /**
   * Get past exam content for reference
   */
  private async getPastExamContent(
    pastExamId: string, 
    userId: string, 
    token?: string
  ): Promise<string | undefined> {
    // Reuse existing implementation from quizGenerationService.ts
    try {
      console.log(`Fetching past exam content for ID: ${pastExamId}`);
      
      // Get authenticated client if token is provided
      const client = token ? await getAuthenticatedClient(token) : supabase;
      
      // Get the past exam record
      const { data: pastExam, error: examError } = await client
        .from('past_exams')
        .select('*')
        .eq('id', pastExamId)
        .eq('user_id', userId)
        .single();
      
      if (examError || !pastExam) {
        console.error('Error fetching past exam:', examError);
        throw new Error(`Could not find past exam with ID: ${pastExamId}`);
      }
      
      // Use standard getFileContent helper
      const { content } = await getFileContent(pastExamId, token);
      
      if (!content) {
        throw new Error(`Could not extract content from past exam: ${pastExamId}`);
      }
      
      console.log(`Successfully extracted past exam content (${content.length} chars)`);
      return content;
    } catch (pastExamError: unknown) {
      console.error('Error processing past exam:', pastExamError);
      return undefined;
    }
  }

  /**
   * Find relevant chunks across multiple files based on topic and subjects
   * @param fileIds Array of file IDs to search within
   * @param workspaceId Workspace ID for filtering
   * @param topic Quiz topic
   * @param selectedSubjects Selected subject names
   * @param userComments Optional user instructions
   * @param token Authentication token
   * @param numberOfQuestions Number of questions to generate
   * @returns Promise resolving to relevant content chunks with file information
   */
  async findRelevantChunksAcrossFiles(
    fileIds: string[],
    workspaceId: string,
    topic: string,
    selectedSubjects: string[],
    userComments?: string,
    token?: string,
    numberOfQuestions: number = 10
  ): Promise<Array<ContentChunk & { file_id: string }>> {
    try {
      // We need to find enough chunks to generate all questions
      // Aim for 1-2 chunks per question depending on length
      const maxChunksPerFile = Math.ceil(numberOfQuestions / fileIds.length);
      const maxTotalChunks = Math.min(numberOfQuestions * 2, 40); // Cap at 40 chunks to limit token usage
      
      // Get authenticated client if token is provided
      const client = token ? await getAuthenticatedClient(token) : supabase;
      
      // Generate embeddings in batch for all queries (topic, subjects, user instructions)
      const queries = [topic, ...selectedSubjects];
      
      // Add user comments if provided
      if (userComments && userComments.trim()) {
        queries.push(userComments);
      }
      
      console.log(`Generating embeddings for ${queries.length} queries across ${fileIds.length} files`);
      // Generate embeddings but we don't use them directly in this simplified implementation
      await this.embeddingManager.generateBatchEmbeddings(queries);
      
      // Use array to track all chunks from multiple files
      const allChunksWithFileIds: Array<ContentChunk & { file_id: string }> = [];
      
      // First try direct query to file_embeddings table with IN filter and workspace filter
      try {
        // Query embeddings from all specified files in the workspace
        const { data: fileEmbeddings, error: embeddingsError } = await client
          .from('file_embeddings')
          .select('id, file_id, content, metadata')
          .in('file_id', fileIds) // Filter by the array of file IDs
          .eq('workspace_id', workspaceId) // Add workspace filter
          .limit(maxTotalChunks);
        
        if (embeddingsError) {
          console.warn('Could not query file_embeddings table directly:', embeddingsError);
          // We'll fall back to individual file processing
        } else if (fileEmbeddings && fileEmbeddings.length > 0) {
          // Process each file's embeddings
          // Simple scoring - no need for complex database functions in early development
          const scoredChunks = fileEmbeddings.map(chunk => {
            // Calculate similarity score (simplified approach)
            const contentText = chunk.content || '';
            const topicScore = this.calculateSimpleRelevanceScore(contentText, topic);
            
            // Add subject scores
            let maxSubjectScore = 0;
            for (const subject of selectedSubjects) {
              const score = this.calculateSimpleRelevanceScore(contentText, subject);
              maxSubjectScore = Math.max(maxSubjectScore, score);
            }
            
            // Combined score (topic is most important)
            const combinedScore = (topicScore * 0.7) + (maxSubjectScore * 0.3);
            
            return {
              content: contentText,
              similarity: combinedScore,
              metadata: chunk.metadata || {},
              file_id: chunk.file_id
            };
          });
          
          // Sort by score
          scoredChunks.sort((a, b) => b.similarity - a.similarity);
          allChunksWithFileIds.push(...scoredChunks);
        }
      } catch (directQueryError) {
        console.warn('Error with direct embedding query, falling back to individual file processing:', directQueryError);
      }
      
      // If we couldn't get chunks from embeddings, process each file individually
      if (allChunksWithFileIds.length === 0) {
        console.log('No embeddings found, processing files individually');
        
        // Process each file to get content
        for (const fileId of fileIds) {
          try {
            // Get file content
            const { content: fileContent } = await getFileContent(fileId, token);
            
            if (fileContent) {
              // Simple content chunking
              const chunkSize = 1800;
              const overlap = 300;
              const chunks: string[] = [];
              
              // Split the content into chunks
              for (let i = 0; i < fileContent.length; i += chunkSize - overlap) {
                const chunk = fileContent.substring(i, Math.min(i + chunkSize, fileContent.length));
                chunks.push(chunk);
              }
              
              // Score chunks for this file
              const fileChunks: Array<ContentChunk & { file_id: string }> = [];
              
              for (const chunk of chunks) {
                const topicScore = this.calculateSimpleRelevanceScore(chunk, topic);
                
                // Add subject scores
                let maxSubjectScore = 0;
                for (const subject of selectedSubjects) {
                  const score = this.calculateSimpleRelevanceScore(chunk, subject);
                  maxSubjectScore = Math.max(maxSubjectScore, score);
                }
                
                // Combined score
                const combinedScore = selectedSubjects.length > 0 
                  ? (topicScore * 0.7) + (maxSubjectScore * 0.3)
                  : topicScore;
                
                fileChunks.push({
                  content: chunk,
                  similarity: combinedScore,
                  metadata: {
                    startChar: fileContent.indexOf(chunk),
                    endChar: fileContent.indexOf(chunk) + chunk.length
                  },
                  file_id: fileId
                });
              }
              
              // Sort chunks for this file by score and take top N
              fileChunks.sort((a, b) => b.similarity - a.similarity);
              allChunksWithFileIds.push(...fileChunks.slice(0, maxChunksPerFile));
            }
          } catch (fileProcessError) {
            console.warn(`Error processing file ${fileId}:`, fileProcessError);
          }
        }
        
        // After processing all files, sort all chunks by score
        allChunksWithFileIds.sort((a, b) => b.similarity - a.similarity);
      }
      
      // Limit total number of chunks
      console.log(`Found ${allChunksWithFileIds.length} content chunks across ${fileIds.length} files`);
      return allChunksWithFileIds.slice(0, maxTotalChunks);
      
    } catch (error) {
      console.error('Error finding relevant chunks across files:', error);
      return [];
    }
  }

  /**
   * Generate a quiz based on content from multiple files
   */
  async generateMultiFileQuiz(params: QuizGenerationParams & { fileIds: string[] }): Promise<Record<string, unknown>> {
    try {
      console.log('Generating multi-file quiz with embeddings using the following parameters:', {
        fileIds: params.fileIds,
        workspaceId: params.workspaceId,
        topic: params.topic,
        numberOfQuestions: params.numberOfQuestions,
        difficultyLevel: params.difficultyLevel,
        aiProvider: params.aiProvider,
        useExamPatterns: params.useExamPatterns
      });

      // 1. Validate inputs
      validateUserInput(params.userComments);
      
      // Validate required parameters
      if (!params.fileIds || params.fileIds.length === 0 || !params.topic || !params.userId || !params.workspaceId) {
        throw new Error('Missing required parameters for multi-file quiz generation');
      }
      
      // 2. Validate file size for primary file (we'll use the first file as primary)
      const primaryFileId = params.fileIds[0];
      await validateFileSize(primaryFileId, params.token);
      
      // 3. Get previous questions to avoid repetition (using workspace ID)
      let previousQuestionTexts = params.previousQuestions || [];
      if (!params.previousQuestions) {
        previousQuestionTexts = await getPreviousQuestions(
          // Pass null as fileId to get all workspace questions
          null, 
          params.workspaceId, 
          params.token
        );
      }

      // 4. Get subject names if IDs are provided
      let selectedSubjectNames: string[] = [];
      if (params.selectedSubjects && params.selectedSubjects.length > 0) {
        selectedSubjectNames = await getSubjectNames(params.selectedSubjects, params.token);
      }
      
      // 5. Get exam patterns if enabled
      let examPatternPrompt = '';
      if (params.useExamPatterns && params.selectedPatternIds && params.selectedPatternIds.length > 0) {
        examPatternPrompt = await fetchExamPatterns(params.selectedPatternIds, params.token);
      }
      
      // 6. Find relevant chunks across all files based on topic and subjects
      const relevantChunks = await this.findRelevantChunksAcrossFiles(
        params.fileIds,
        params.workspaceId,
        params.topic,
        selectedSubjectNames,
        params.userComments,
        params.token,
        params.numberOfQuestions || 10
      );
      
      // If no relevant chunks found, throw error
      if (relevantChunks.length === 0) {
        throw new Error('Could not find relevant content across the selected files');
      }
      
      // Combine chunks into a single content string
      const contentToUse = relevantChunks
        .map(chunk => chunk.content)
        .join('\n\n');
      
      console.log(`Combined ${relevantChunks.length} chunks into ${contentToUse.length} characters for quiz generation`);
      
      // 7. Get file metadata of primary file for language detection
      const { data: primaryFile, error: fileError } = await (params.token ? 
        await getAuthenticatedClient(params.token) : supabase)
        .from('files')
        .select('*')
        .eq('id', primaryFileId)
        .single();
        
      if (fileError || !primaryFile) {
        throw new Error(`Could not find primary file with ID: ${primaryFileId}`);
      }
      
      // 8. Update file's detected language or get from metadata
      const detectedLanguage = await updateFileLanguage(primaryFile as FileMetadata, contentToUse, primaryFileId, params.token);
      
      // 9. Determine which language to use for generation
      // Priority: 1. User locale (if provided), 2. Detected language, 3. Default to 'en'
      const languageForGeneration = params.locale || detectedLanguage || 'en';
      console.log(`Using language for quiz generation: ${languageForGeneration}`);
      
      // 10. Setup AI service and options
      const { aiService, aiOptions } = createAIService(params.aiProvider);
      
      // Add additional options to aiOptions directly
      aiOptions.language = languageForGeneration;
      aiOptions.includeFileReferences = params.includeFileReferences !== false;
      aiOptions.includePastExam = params.includePastExam;
      aiOptions.pastExamContent = params.pastExamContent;
      
      // If exam patterns were fetched, use them
      if (examPatternPrompt) {
        // Store exam pattern data as custom property
        (aiOptions as ExtendedAIOptions).examPatternData = examPatternPrompt;
      }
      
      // 11. Log generation details for debugging
      console.log(`Using provider ${params.aiProvider} with model ${aiOptions.model} for quiz generation`);
      console.log(`Content length: ${contentToUse.length} chars in language: ${languageForGeneration}`);
      console.log(`File references in explanations: ${params.includeFileReferences !== false ? 'enabled' : 'disabled'}`);
      
      // 12. Generate quiz using AI service
      console.log(`Sending request to AI service for quiz generation`);
      const response = await aiService.generateQuiz(
        contentToUse,
        {
          topic: params.topic,
          numberOfQuestions: params.numberOfQuestions || 10,
          difficultyLevel: params.difficultyLevel || 'medium',
          pastExamContent: params.pastExamContent,
          locale: languageForGeneration,
          userComments: params.userComments,
          selectedSubjects: selectedSubjectNames,
          previousQuestions: previousQuestionTexts
        }
      );
      
      console.log('Received AI response:', {
        modelUsed: response.modelUsed,
        tokenCount: response.tokenCount,
        contentLength: response.content.length,
      });
      
      // 13. Store the generated quiz (using primary file ID)
      const quiz = await storeGeneratedQuiz(
        params.userId,
        params.workspaceId,
        primaryFileId, // Use primary file as the main file for the quiz
        params.topic,
        response,
        contentToUse.substring(0, Math.min(contentToUse.length, 10000)),
        languageForGeneration,
        {
          aiProvider: params.aiProvider,
          numberOfQuestions: params.numberOfQuestions,
          userComments: params.userComments,
          selectedSubjects: selectedSubjectNames,
          includeFileReferences: params.includeFileReferences,
          useEmbeddings: true, // Mark that this quiz was generated using embeddings
          isMultiFile: true, // Mark as multi-file quiz
          fileIds: params.fileIds // Store all file IDs
        },
        params.difficultyLevel || 'medium',
        previousQuestionTexts
      );
      
      return quiz;
    } catch (error: unknown) {
      const typedError = error as Error;
      console.error('Error in multi-file embedding-based quiz generation:', {
        message: typedError.message,
        stack: typedError.stack,
        originalError: (typedError as CustomError).originalError || 'No original error'
      });
      
      // Format the error message to be more user-friendly based on error type
      let userFriendlyError: CustomError;
      
      // Check for common error categories and provide specific guidance
      if (typedError.message?.includes('token limit') || 
          typedError.message?.includes('max_tokens') || 
          typedError.message?.includes('maximum allowed number of output tokens')) {
        
        userFriendlyError = new Error(
          `The AI model couldn't generate all ${params.numberOfQuestions} questions due to token limits.\n\n` +
          `Suggestions:\n` +
          `1. Reduce the number of questions (try 10-15)\n` +
          `2. Use fewer subject filters\n` +
          `3. Select fewer files\n` +
          `4. Choose a more powerful AI model`
        ) as CustomError;
        
        userFriendlyError.code = 'TOKEN_LIMIT_ERROR';
      } 
      else if (typedError.message?.includes('Invalid JSON') || 
              typedError.message?.includes('Failed to parse AI')) {
        
        userFriendlyError = new Error(
          `There was an issue processing the AI's response for your ${params.numberOfQuestions}-question quiz.\n\n` +
          `Please try:\n` +
          `1. Generating a smaller quiz (15 questions or fewer)\n` +
          `2. Trying again (sometimes the AI response format varies)\n` +
          `3. Using a less complex topic`
        ) as CustomError;
        userFriendlyError.code = 'JSON_PARSE_ERROR';
      }
      else if (typedError.message?.includes('File size')) {
        // File size errors - keep original message as it's already descriptive
        userFriendlyError = typedError as CustomError;
        userFriendlyError.code = 'FILE_SIZE_ERROR';
      }
      else if (typedError.message?.includes('Could not find relevant content')) {
        userFriendlyError = new Error(
          `We couldn't find relevant content for "${params.topic}" across the selected files.\n\n` +
          `Suggestions:\n` +
          `1. Try a different topic\n` +
          `2. Ensure the selected files contain content related to the topic\n` +
          `3. Try with fewer or different subject filters`
        ) as CustomError;
        userFriendlyError.code = 'NO_RELEVANT_CONTENT_ERROR';
      }
      else {
        // Generic error with minimal processing
        userFriendlyError = new Error(
          `Multi-file quiz generation failed: ${typedError.message}`
        ) as CustomError;
      }
      
      // Preserve the original error for debugging
      userFriendlyError.originalError = typedError;
      
      throw userFriendlyError;
    }
  }
}

// Create singleton instance
const embeddingBasedQuizService = new EmbeddingBasedQuizService();

// Export both single and multi-file generation functions
export const generateQuizWithEmbeddings = async (params: QuizGenerationParams): Promise<Record<string, unknown>> => {
  // Check if this is a multi-file request
  if ((params as any).fileIds && Array.isArray((params as any).fileIds)) {
    return embeddingBasedQuizService.generateMultiFileQuiz(params as QuizGenerationParams & { fileIds: string[] });
  }
  // Otherwise, use the standard single-file generation
  return embeddingBasedQuizService.generateQuiz(params);
}; 