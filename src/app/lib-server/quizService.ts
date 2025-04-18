'use server';

import { supabase, getAuthenticatedClient } from './supabaseClient';
import { Quiz, QuizGenerationParams } from '@/app/models/quiz';
import { AIServiceFactory } from './ai/AIServiceFactory';
import { FileMetadata } from '@/app/models/file';
import { createClient } from '@supabase/supabase-js';
import { detectLanguage } from '@/app/utils/fileProcessing/textProcessing';
import { AIServiceOptions } from './ai/AIService';
import { extractTextFromFile } from '@/app/utils/fileProcessing/index';
import { AIConfig } from './ai/AIConfig';
import api from '../lib/axios';
import { getFileSizeFromId } from './filesService';
import { FILE_SIZE_LIMITS, formatFileSize } from '@/hooks/useFileUpload';
import { validateUserInstructions } from '@/app/lib-server/securityService';

/**
 * Creates a quiz in the database and returns the result
 */
export const createQuiz = async (quiz: Quiz, token?: string): Promise<Quiz> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  const { data, error } = await client
    .from('quizzes')
    .insert([
      {
        title: quiz.title,
        questions: quiz.questions,
        file_id: quiz.fileId,
        workspace_id: quiz.workspaceId,
        user_id: quiz.userId,
        user_comments: quiz.userComments,
        selected_subjects: quiz.selectedSubjects,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }

  // Transform the data to match our Quiz interface
  return {
    id: data.id,
    title: data.title,
    questions: data.questions,
    fileId: data.file_id,
    workspaceId: data.workspace_id,
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    userComments: data.user_comments,
    selectedSubjects: data.selected_subjects,
  };
};

/**
 * Get file content with truncation for very large files to prevent token limit errors
 */
export const getFileContent = async (
  fileId: string,
  token?: string
): Promise<{ file: FileMetadata; content: string }> => {
  try {
    // Use authenticated client if token provided
    const client = token ? await getAuthenticatedClient(token) : supabase;

    // Query the file metadata
    const { data: file, error: fileError } = await client
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      console.error("Error fetching file:", fileError);
      throw new Error(`File not found: ${fileId}`);
    }

    console.log(`Found file metadata:`, {
      id: file.id,
      name: file.name,
      workspaceId: file.workspace_id,
      url: file.url
    });
    
    // Determine the file path for download
    let filePath = `${file.workspace_id}/${file.name}`;
    
    // Check if the URL contains a different path pattern
    if (file.url) {
      const urlMatch = file.url.match(/\/files\/([^?]+)/);
      if (urlMatch && urlMatch[1]) {
        filePath = urlMatch[1];
        console.log(`Using path from URL: ${filePath}`);
      }
    }
    
    console.log(`Attempting to download file from storage path: ${filePath}`);

    // Get the file from storage
    let fileData;
    let storageError;
    
    // First attempt with the primary path
    const primaryDownloadResult = await client.storage
      .from("files")
      .download(filePath);
      
    fileData = primaryDownloadResult.data;
    storageError = primaryDownloadResult.error;

    if (storageError || !fileData) {
      console.error("Error downloading file:", storageError);
      
      // Try an alternative path if the first one fails
      console.log(`First download attempt failed, trying alternative path structure...`);
      
      // Try with public/ prefix
      const altPath = `public/${file.workspace_id}/${file.name}`;
      console.log(`Attempting with alternative path: ${altPath}`);
      
      const altDownloadResult = await client.storage
        .from("files")
        .download(altPath);
        
      fileData = altDownloadResult.data;
      const altError = altDownloadResult.error;
        
      if (altError || !fileData) {
        console.error("Alternative download also failed:", altError);
        throw new Error(`Could not download file: ${file.name}. Please check file permissions and path.`);
      }
      
      console.log(`Alternative download successful!`);
    }

    // Get file extension and MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = getMimeTypeFromExtension(fileExtension);
    console.log(`Processing file with extension: ${fileExtension}, MIME type: ${mimeType}`);

    // Extract text content
    const arrayBuffer = await fileData.arrayBuffer();
    console.log(`File loaded as ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);
    
    let content = await extractTextFromFile(
      arrayBuffer,
      mimeType,
      file.name,
      { language: 'auto' }
    );
    
    console.log(`Text extraction complete, extracted ${content.length} characters`);
    
    // Check and truncate content if it's too large
    // An average GPT-4o prompt can handle about 100k characters safely
    const MAX_SAFE_CHARS = 100000;
    if (content.length > MAX_SAFE_CHARS) {
      console.warn(`File content is very large (${content.length} chars). Truncating to ${MAX_SAFE_CHARS} chars to prevent token limit errors.`);
      content = content.substring(0, MAX_SAFE_CHARS);
      content += "\n\n[Content truncated due to length...]";
    }
    
    // Get the detected language from file metadata or detect it from content
    let detectedLanguage = file.metadata?.detectedLanguage;
    
    // If language isn't in metadata, detect it from content
    if (!detectedLanguage) {
      detectedLanguage = detectLanguage(content);
      console.log(`Language not found in metadata, detected from content: ${detectedLanguage}`);
      
      // Update the file metadata with the detected language for future use
      try {
        await client
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
        // Continue execution even if metadata update fails
      }
    } else {
      console.log(`Using language from file metadata: ${detectedLanguage}`);
    }

    return { file, content };
  } catch (error) {
    console.error("Error in getFileContent:", error);
    throw error;
  }
};

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
 * Generates a quiz based on a file's content using AI
 */
export const generateQuiz = async (params: QuizGenerationParams): Promise<Quiz> => {
  try {
    console.log('Generating quiz with the following parameters:', {
      fileId: params.fileId,
      topic: params.topic,
      numberOfQuestions: params.numberOfQuestions,
      difficultyLevel: params.difficultyLevel
    });

    // Perform security validation for user comments/instructions
    if (params.userComments) {
      const instructionsValidation = validateUserInstructions(params.userComments);
      if (!instructionsValidation.valid) {
        console.error(`Security validation failed for user instructions: ${instructionsValidation.message}`);
        throw new Error(instructionsValidation.message || 'Invalid instructions detected');
      }
    }

    // Validate required parameters
    if (!params.fileId || !params.topic || !params.userId || !params.workspaceId) {
      throw new Error('Missing required parameters for quiz generation');
    }
    
    // Validate file size
    try {
      const fileInfo = await getFileSizeFromId(params.fileId, params.token);
      
      if (fileInfo) {
        const { size, type } = fileInfo;
        const sizeLimit = FILE_SIZE_LIMITS[type as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS['default'];
        
        if (size > sizeLimit) {
          const readableSize = formatFileSize(size);
          const readableLimit = formatFileSize(sizeLimit);
          
          console.log(`File size validation failed: ${readableSize} exceeds limit of ${readableLimit}`);
          
          throw new Error(`File size (${readableSize}) exceeds the maximum allowed size (${readableLimit}) for quiz generation.`);
        }
      }
    } catch (error: any) {
      // Only rethrow if this is already our validation error
      if (error.message && error.message.includes('File size')) {
        throw error;
      }
      
      // Otherwise log and continue
      console.warn('Error validating file size:', error);
    }
    
    // Get authenticated client if token is provided
    const client = params.token ? await getAuthenticatedClient(params.token) : supabase;

    // Get file content to generate from
    const { content: fileContent } = await getFileContent(params.fileId, params.token);
    
    // If no content, throw error
    if (!fileContent) {
      throw new Error(`No content found for file with ID: ${params.fileId}`);
    }
    
    // If includePastExam is true and pastExamId is provided but pastExamContent is not,
    // fetch and extract the past exam content
    if (params.includePastExam && params.pastExamId && !params.pastExamContent) {
      try {
        console.log(`Fetching past exam content for ID: ${params.pastExamId}`);
        
        // Get the past exam record
        const { data: pastExam, error: examError } = await client
          .from('past_exams')
          .select('*')
          .eq('id', params.pastExamId)
          .eq('user_id', params.userId)
          .single();
        
        if (examError || !pastExam) {
          console.error('Error fetching past exam:', examError);
          throw new Error(`Could not find past exam with ID: ${params.pastExamId}`);
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
          { language: 'auto' }
        );
        
        // Set the extracted text as pastExamContent
        params.pastExamContent = extractedText;
        console.log(`Successfully extracted past exam content (${extractedText.length} chars)`);
      } catch (pastExamError) {
        console.error('Error processing past exam:', pastExamError);
        // Continue without past exam content if there's an error
        console.log('Continuing quiz generation without past exam reference');
        params.includePastExam = false;
        params.pastExamContent = undefined;
      }
    }
    
    // Fetch previous quizzes if not already provided
    let previousQuestionTexts: string[] = [];
    if (!params.previousQuestions) {
      try {
        console.log('Fetching previous quizzes to avoid question repetition');
        const client = params.token ? await getAuthenticatedClient(params.token) : supabase;
        
        const { data: previousQuizzes, error } = await client
          .from('quizzes')
          .select('questions')
          .eq('file_id', params.fileId)
          .eq('workspace_id', params.workspaceId)
          .order('created_at', { ascending: false })
          .limit(5); // Get the most recent 5 quizzes
        
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
          console.log(`Extracted ${previousQuestionTexts.length} previous questions and key phrases to avoid repetition`);
        }
      } catch (error) {
        console.warn('Error fetching previous quizzes:', error);
        // Continue execution even if fetch fails
      }
    } else {
      previousQuestionTexts = params.previousQuestions;
      console.log(`Using ${previousQuestionTexts.length} provided previous questions to avoid repetition`);
    }

    // Validate required parameters
    if (!params.token) {
      throw new Error('Authentication token is required for quiz generation');
    }

    // Get file content
    console.log(`Fetching content for file ID: ${params.fileId}`);
    // Pass the token to getFileContent to enable authenticated file download
    const { file, content } = await getFileContent(params.fileId, params.token);
    console.log(`Successfully retrieved file: ${file.name}, content length: ${content.length} chars`);

    // Check if we have enough content to generate a quiz
    if (content.trim().length < 50) {
      throw new Error('Not enough text content extracted from the file to generate a quiz.');
    }

    // Get language preference or fall back to detected language
    let preferredLanguage = params.locale;
    let detectedLanguage = file.metadata?.detectedLanguage;
    
    console.log(`User locale from request: ${preferredLanguage || 'not provided'}`);
    console.log(`Detected language from file: ${detectedLanguage || 'not detected'}`);
    
    // Determine which language to use for generation
    // Priority: 1. User locale (if provided), 2. Detected language, 3. Default to 'en'
    const languageForGeneration = preferredLanguage || detectedLanguage || 'en';
    
    console.log(`Using language for quiz generation: ${languageForGeneration}`);
    
    // If detected language isn't already in metadata, save it for future use
    if (!detectedLanguage && !preferredLanguage) {
      detectedLanguage = detectLanguage(content);
      console.log(`Language detected from content: ${detectedLanguage}`);
      
      // Update the file metadata with the detected language for future use
      try {
        // Create authenticated client using the same token
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
        const updateClient = params.token 
          ? createClient(supabaseUrl, supabaseAnonKey, {
              global: { headers: { Authorization: `Bearer ${params.token}` } }
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
          .eq("id", params.fileId);
        
        console.log(`Updated file metadata with detected language: ${detectedLanguage}`);
      } catch (updateError) {
        console.warn(`Failed to update file metadata with language: ${updateError}`);
        // Continue execution even if metadata update fails
      }
    }
    
    // Use AIConfig to get the appropriate service for quiz generation
    console.log('Using AIConfig to determine the best AI service for quiz generation');
    const aiConfig = AIConfig.getInstance();
    const aiService = aiConfig.getServiceForFeature('quiz_generation');
    
    // Get configuration details for logging
    const featureConfig = aiConfig.getFeatureConfig('quiz_generation');
    console.log(`Selected AI service: ${featureConfig?.provider}, model: ${featureConfig?.model || 'default'}`);
    
    console.log(`Sending request to AI service for quiz generation in language: ${languageForGeneration}`);
    
    // Add language information to options for better AI generation
    const aiOptions: AIServiceOptions = {
      temperature: 0.7,
      maxTokens: 2000,
      language: languageForGeneration,
      model: 'gpt-4o-mini', // Changed from gpt-4o to gpt-4o-mini for higher token limits
      includeFileReferences: params.includeFileReferences !== false, // Default to true if not specified
      includePastExam: params.includePastExam,
      pastExamContent: params.pastExamContent
    };
    
    console.log(`Using model gpt-4o-mini for quiz generation on content length: ${content.length} chars in language: ${languageForGeneration}`);
    console.log(`File references in explanations: ${params.includeFileReferences !== false ? 'enabled' : 'disabled'}`);
    console.log(`Including past exam as reference: ${params.includePastExam ? 'yes' : 'no'}`);
    if (params.includePastExam && params.pastExamContent) {
      console.log(`Past exam content length: ${params.pastExamContent.length} chars`);
    }
    
    // Log a sample of the content to verify language detection was correct
    const contentSample = content.substring(0, 200).replace(/\n/g, ' ');
    console.log(`Content sample (first 200 chars): "${contentSample}..."`);

    // Log if user comments and subject focus are provided
    if (params.userComments) {
      console.log(`User provided custom instructions: ${params.userComments.substring(0, 100)}${params.userComments.length > 100 ? '...' : ''}`);
    }

    if (params.selectedSubjects && params.selectedSubjects.length > 0) {
      console.log(`User selected specific subjects to focus on: ${params.selectedSubjects.join(', ')}`);
    }
    
    // Fetch subject names if IDs are provided
    let selectedSubjectNames: string[] = [];
    if (params.selectedSubjects && params.selectedSubjects.length > 0) {
      try {
        // Get authenticated client
        const client = params.token ? await getAuthenticatedClient(params.token) : supabase;
          
        // Get subject names from IDs
        const { data: subjects, error } = await client
          .from("subjects")
          .select("name")
          .in("id", params.selectedSubjects);
          
        if (error) {
          console.warn(`Could not fetch subject names: ${error.message}`);
        } else if (subjects) {
          selectedSubjectNames = subjects.map(s => s.name);
          console.log(`Retrieved subject names: ${selectedSubjectNames.join(', ')}`);
        }
      } catch (error) {
        console.warn('Error fetching subject names:', error);
        // Continue execution even if subject name fetch fails
      }
    }
    
    const response = await aiService.generateQuiz(
      content,
      params.topic,
      params.numberOfQuestions,
      params.difficultyLevel,
      aiOptions,
      params.userComments,
      selectedSubjectNames,
      previousQuestionTexts
    );
    
    console.log('Received AI response:', {
      modelUsed: response.modelUsed,
      tokenCount: response.tokenCount,
      contentLength: response.content.length,
    });
    
    // Check if any of the new questions are potential duplicates of previous ones
    const checkForDuplicates = (newQuestions: any[], previousQuestionsTexts: string[]): void => {
      if (!newQuestions || !previousQuestionsTexts.length) return;
      
      const potentialDuplicates: {newQuestion: string, similarTo: string, similarity: number}[] = [];
      
      newQuestions.forEach(question => {
        const questionText = question.question || '';
        
        // Skip empty questions
        if (!questionText) return;
        
        previousQuestionsTexts.forEach(prevQuestion => {
          // Skip comparing to non-strings or empty strings
          if (typeof prevQuestion !== 'string' || !prevQuestion.trim()) return;
          
          // Simple similarity check - how many characters in sequence match
          let matchCount = 0;
          const minLength = Math.min(questionText.length, prevQuestion.length);
          
          // Check for any substantial matching substrings (more likely in non-Latin scripts)
          const questionTextLower = questionText.toLowerCase();
          const prevQuestionLower = prevQuestion.toLowerCase();
          
          // Track the longest common substring
          let longestMatch = '';
          for (let i = 0; i < questionTextLower.length - 4; i++) {
            for (let len = 5; i + len <= questionTextLower.length; len++) {
              const substring = questionTextLower.substring(i, i + len);
              if (prevQuestionLower.includes(substring) && substring.length > longestMatch.length) {
                longestMatch = substring;
              }
            }
          }
          
          // Calculate similarity as a percentage based on the longest match
          const similarity = longestMatch.length > 4 ? 
            (longestMatch.length / Math.min(questionText.length, prevQuestion.length)) * 100 : 0;
          
          // If similarity is above threshold, log it
          if (similarity > 30) {  // 30% similarity threshold
            potentialDuplicates.push({
              newQuestion: questionText,
              similarTo: prevQuestion,
              similarity
            });
          }
        });
      });
      
      // Log any potential duplicates found
      if (potentialDuplicates.length > 0) {
        console.warn(`⚠️ POTENTIAL DUPLICATE QUESTIONS DETECTED ⚠️`);
        potentialDuplicates.forEach(dup => {
          console.warn(`Similarity: ${dup.similarity.toFixed(2)}%`);
          console.warn(`New: ${dup.newQuestion}`);
          console.warn(`Similar to: ${dup.similarTo}`);
          console.warn('---');
        });
      }
    };

    // Add the response processing and duplicate checking
    let parsedContent;
    try {
      // Clean the response content by removing any markdown formatting
      let cleanedContent = response.content;
      
      // Remove markdown code blocks if present
      cleanedContent = cleanedContent.replace(/```json\s*/g, '');
      cleanedContent = cleanedContent.replace(/```\s*/g, '');
      
      // Remove any additional text before or after the JSON
      const jsonStartIdx = cleanedContent.indexOf('{');
      const jsonEndIdx = cleanedContent.lastIndexOf('}');
      
      if (jsonStartIdx >= 0 && jsonEndIdx >= 0 && jsonEndIdx > jsonStartIdx) {
        cleanedContent = cleanedContent.substring(jsonStartIdx, jsonEndIdx + 1);
      }
      
      // Trim whitespace
      cleanedContent = cleanedContent.trim();
      
      console.log('Cleaned content for parsing:', cleanedContent.substring(0, 100) + '...');
      
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('AI response content:', response.content.substring(0, 500) + '...');
      throw new Error('Failed to parse AI-generated quiz: Invalid JSON response');
    }

    // Validate the parsed content
    if (!parsedContent.title || !Array.isArray(parsedContent.questions) || parsedContent.questions.length === 0) {
      throw new Error('Invalid quiz structure returned by AI');
    }

    // Check for duplicate questions with what was previously generated
    if (parsedContent.questions && previousQuestionTexts.length > 0) {
      console.log('Checking for potential duplicate questions...');
      checkForDuplicates(parsedContent.questions, previousQuestionTexts);
    }

    const quizData: Quiz = {
      title: params.topic, // Use the user-provided topic as the quiz title
      questions: parsedContent.questions,
      fileId: params.fileId,
      workspaceId: params.workspaceId,
      userId: params.userId,
      userComments: params.userComments,
      selectedSubjects: params.selectedSubjects
    };
    
    console.log(`Successfully parsed quiz: "${quizData.title}" with ${quizData.questions.length} questions`);
    
    // Store the quiz in the database
    console.log('Saving quiz to database');
    const savedQuiz = await createQuiz(quizData, params.token);
    console.log(`Quiz saved successfully with ID: ${savedQuiz.id}`);
    return savedQuiz;
    
  } catch (error: any) {
    console.error('Error in quiz generation:', {
      message: error.message,
      stack: error.stack,
      originalError: error.originalError || 'No original error'
    });
    throw error;
  }
};

/**
 * Fetches quizzes by workspace ID
 */
export const getQuizzesByWorkspace = async (workspaceId: string, token?: string): Promise<Quiz[]> => {
  console.log(`Starting getQuizzesByWorkspace with workspaceId: ${workspaceId}`);
  console.log(`TOKEN QUIZZES !!!!!!: ${token}`);
  
  try {
    // Use authenticated client if token provided
    const client = token ? await getAuthenticatedClient(token) : supabase;
    
    console.log('Making Supabase query...');
    const { data, error } = await client
      .from('quizzes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in Supabase query:', error);
      throw error;
    }

    if (!data) {
      console.log('No data returned from Supabase');
      return [];
    }

    console.log(`Successfully retrieved ${data.length} quizzes`);

    // Transform the data to match our Quiz interface
    return data.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions,
      fileId: quiz.file_id,
      workspaceId: quiz.workspace_id,
      userId: quiz.user_id,
      createdAt: quiz.created_at,
      updatedAt: quiz.updated_at,
      userComments: quiz.user_comments,
      selectedSubjects: quiz.selected_subjects,
    }));
  } catch (error) {
    console.error('Error in getQuizzesByWorkspace:', error);
    throw error;
  }
};

/**
 * Gets a quiz by ID
 */
export const getQuizById = async (quizId: string, token?: string): Promise<Quiz | null> => {
  console.log(`[getQuizById] Attempting to fetch quiz with ID: "${quizId}"`);
  console.log(`[getQuizById] Using token: ${token ? 'yes' : 'no'}`);
  
  // Use authenticated client if token provided
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  console.log(`[getQuizById] Making database query...`);
  
  // First verify the table exists and has data
  const { data: tableInfo, error: tableError } = await client
    .from('quizzes')
    .select('count')
    .limit(1);
    
  console.log(`[getQuizById] Table info:`, {
    hasData: !!tableInfo,
    error: tableError
  });
  
  // Now try to fetch the specific quiz
  const { data, error } = await client
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single();

  if (error) {
    console.error('[getQuizById] Error fetching quiz:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    
    if (error.code === 'PGRST116') {
      // No rows found - return null instead of throwing
      return null;
    }
    throw error;
  }

  if (!data) {
    console.log(`[getQuizById] No data returned for quiz ID: "${quizId}"`);
    return null;
  }

  console.log(`[getQuizById] Successfully found quiz:`, {
    id: data.id,
    title: data.title,
    questionsCount: data.questions?.length || 0
  });

  // Transform the data to match our Quiz interface
  return {
    id: data.id,
    title: data.title,
    questions: data.questions,
    fileId: data.file_id,
    workspaceId: data.workspace_id,
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    userComments: data.user_comments,
    selectedSubjects: data.selected_subjects,
  };
};

/**
 * Deletes a quiz from the database by ID
 */
export const deleteQuiz = async (quizId: string, token?: string): Promise<boolean> => {
  try {
    // Use authenticated client if token provided
    const client = token ? await getAuthenticatedClient(token) : supabase;
    
    // Delete the quiz from the database
    const { error } = await client
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }

    console.log(`Quiz with ID ${quizId} successfully deleted`);
    return true;
  } catch (error) {
    console.error('Error in deleteQuiz:', error);
    throw error;
  }
};

/**
 * Extracts a file path from a Supabase Storage URL
 */
function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // The path usually follows the pattern /storage/v1/object/public/files/private/user_id/workspace_id/filename
    // We need to extract the part after "files/"
    const pathParts = urlObj.pathname.split('/');
    const filesIndex = pathParts.findIndex(part => part === 'files');
    
    if (filesIndex !== -1 && filesIndex < pathParts.length - 1) {
      return pathParts.slice(filesIndex + 1).join('/');
    }
    return null;
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
    return null;
  }
}