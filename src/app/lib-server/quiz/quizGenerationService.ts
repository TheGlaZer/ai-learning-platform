'use server';

import { QuizGenerationParams } from '@/app/models/quiz';
import { getFileContent } from '../file/fileContentHelper';
import { validateFileSize, validateUserInput } from './quizValidation';
import { 
  getPreviousQuestions, 
  getSubjectNames, 
  findRelevantContentSections, 
  createAIService,
  updateFileLanguage,
  fetchExamPatterns
} from './quizGenerationHelper';
import { storeGeneratedQuiz } from './quizStorage';
import { extractFilePathFromUrl } from '../file/fileContentHelper';

/**
 * Generates a quiz based on a file's content using AI
 */
export const generateQuiz = async (params: QuizGenerationParams): Promise<any> => {
  try {
    console.log('Generating quiz with the following parameters:', {
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
    
    // 3. Get file content
    const { file, content: fileContent } = await getFileContent(params.fileId, params.token);
    
    // If no content, throw error
    if (!fileContent) {
      throw new Error(`No content found for file with ID: ${params.fileId}`);
    }
    
    // 4. Handle past exam content if provided
    if (params.includePastExam && params.pastExamId && !params.pastExamContent) {
      params.pastExamContent = await getPastExamContent(params.pastExamId, params.userId, params.token);
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
    let patternPrompt = '';
    if (params.useExamPatterns && params.selectedPatternIds && params.selectedPatternIds.length > 0) {
      patternPrompt = await fetchExamPatterns(params.selectedPatternIds, params.token);
    }
    
    // 8. Extract relevant content based on selected subjects
    let contentToUse = fileContent;
    if (selectedSubjectNames.length > 0) {
      contentToUse = await findRelevantContentSections(
        params.fileId,
        fileContent,
        selectedSubjectNames,
        params.token
      );
    }
    
    // 9. Update file's detected language or get from metadata
    let detectedLanguage = await updateFileLanguage(file, contentToUse, params.fileId, params.token);
    
    // 10. Determine which language to use for generation
    // Priority: 1. User locale (if provided), 2. Detected language, 3. Default to 'en'
    const languageForGeneration = params.locale || detectedLanguage || 'en';
    console.log(`Using language for quiz generation: ${languageForGeneration}`);
    
    // 11. Setup AI service and options
    const { aiService, aiOptions } = createAIService(params.aiProvider);
    
    // Add additional options
    aiOptions.language = languageForGeneration;
    aiOptions.includeFileReferences = params.includeFileReferences !== false;
    aiOptions.includePastExam = params.includePastExam;
    aiOptions.pastExamContent = params.pastExamContent;
    
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
        includeFileReferences: params.includeFileReferences
      },
      params.difficultyLevel || 'medium',
      previousQuestionTexts
    );
    
    return quiz;
  } catch (error: any) {
    console.error('Error in quiz generation:', {
      message: error.message,
      stack: error.stack,
      originalError: error.originalError || 'No original error'
    });
    
    // Format the error message to be more user-friendly based on error type
    let userFriendlyError: Error;
    
    // Check for common error categories and provide specific guidance
    if (error.message?.includes('token limit') || 
        error.message?.includes('max_tokens') || 
        error.message?.includes('maximum allowed number of output tokens')) {
      
      userFriendlyError = new Error(
        `The AI model couldn't generate all ${params.numberOfQuestions} questions due to token limits.\n\n` +
        `Suggestions:\n` +
        `1. Reduce the number of questions (try 10-15)\n` +
        `2. Use a smaller input file\n` +
        `3. Choose a more powerful AI model`
      );
      
      (userFriendlyError as any).code = 'TOKEN_LIMIT_ERROR';
    } 
    else if (error.message?.includes('Invalid JSON') || 
             error.message?.includes('Failed to parse AI')) {
      
      userFriendlyError = new Error(
        `There was an issue processing the AI's response for your ${params.numberOfQuestions}-question quiz.\n\n` +
        `Please try:\n` +
        `1. Generating a smaller quiz (15 questions or fewer)\n` +
        `2. Trying again (sometimes the AI response format varies)\n` +
        `3. Using a less complex topic`
      );
      (userFriendlyError as any).code = 'JSON_PARSE_ERROR';
    }
    else if (error.message?.includes('File size')) {
      // File size errors - keep original message as it's already descriptive
      userFriendlyError = error;
      (userFriendlyError as any).code = 'FILE_SIZE_ERROR';
    }
    else {
      // Generic error with minimal processing
      userFriendlyError = new Error(
        `Quiz generation failed: ${error.message}`
      );
    }
    
    // Preserve the original error for debugging
    (userFriendlyError as any).originalError = error;
    
    throw userFriendlyError;
  }
};

/**
 * Get past exam content for reference
 */
async function getPastExamContent(pastExamId: string, userId: string, token?: string): Promise<string | undefined> {
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
    
    // Extract file path from the URL
    const filePath = extractFilePathFromUrl(pastExam.url);
    if (!filePath) {
      throw new Error(`Invalid URL for past exam: ${pastExam.url}`);
    }
    
    // Download the file
    console.log(`Downloading past exam file from path: ${filePath}`);
    const { data: fileData, error: fileError } = await client.storage
      .from('files')
      .download(filePath);
    
    if (fileError || !fileData) {
      console.error('Error downloading past exam file:', fileError);
      throw new Error('Failed to download past exam file');
    }
    
    // Get file extension and MIME type
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const mimeType = getMimeTypeFromExtension(fileExtension);
    
    // Extract text from the file
    const arrayBuffer = await fileData.arrayBuffer();
    const extractedText = await extractTextFromFile(
      arrayBuffer,
      mimeType,
      filePath.split('/').pop() || 'past_exam',
      { 
        language: 'auto',
        addPageMarkers: true // Add page markers for better context
      }
    );
    
    console.log(`Successfully extracted past exam content (${extractedText.length} chars)`);
    return extractedText;
  } catch (pastExamError) {
    console.error('Error processing past exam:', pastExamError);
    return undefined;
  }
}

// Import these functions here to avoid circular dependencies
import { getMimeTypeFromExtension } from '../file/fileContentHelper';
import { extractTextFromFile } from '@/app/utils/fileProcessing/index';
import { getAuthenticatedClient, supabase } from '../supabaseClient'; 