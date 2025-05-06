'use server';

import { Quiz } from '@/app/models/quiz';
import { supabase, getAuthenticatedClient } from '../supabaseClient';
import { AIEmbeddingService } from '../AIEmbeddingService';
import { safeParseJSON } from '@/app/utils/jsonUtils';
import { checkForDuplicates } from './quizValidation';

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
 * Stores the AI-generated quiz in the database
 */
export async function storeGeneratedQuiz(
  userId: string,
  workspaceId: string,
  fileId: string,
  topic: string,
  aiResponse: any,
  sourceContent: string,
  language: string,
  options: any,
  difficultyLevel: string,
  previousQuestionTexts: string[]
): Promise<any> {
  try {
    // Parse the AI response if it's a string
    let parsedResponse;
    
    if (typeof aiResponse.content === 'string') {
      try {
        console.log('Parsing AI response with safeParseJSON utility');
        parsedResponse = safeParseJSON(aiResponse.content);
        console.log('Successfully parsed AI response');
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('AI response content:', aiResponse.content.substring(0, 500) + '...');
        throw new Error('Failed to parse AI-generated quiz: Invalid JSON response');
      }
    } else {
      parsedResponse = aiResponse.content;
    }

    // Validate the parsed content
    if (!parsedResponse.title || !Array.isArray(parsedResponse.questions) || parsedResponse.questions.length === 0) {
      throw new Error('Invalid quiz structure returned by AI');
    }

    // Check for duplicate questions with what was previously generated
    if (parsedResponse.questions && previousQuestionTexts.length > 0) {
      console.log('Checking for potential duplicate questions...');
      checkForDuplicates(parsedResponse.questions, previousQuestionTexts);
    }

    // Create the quiz record
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        title: parsedResponse.title || `${topic} Quiz`,
        description: parsedResponse.description || '',
        topic: topic,
        difficulty_level: difficultyLevel,
        file_id: fileId,
        source_content: sourceContent.substring(0, Math.min(sourceContent.length, 10000)),
        language: language,
        metadata: {
          generated_by: options.aiProvider || 'default',
          model_used: aiResponse.modelUsed,
          token_count: aiResponse.tokenCount,
          options: {
            numberOfQuestions: options.numberOfQuestions,
            userComments: options.userComments || null,
            selectedSubjects: options.selectedSubjects,
            includeFileReferences: options.includeFileReferences
          }
        }
      })
      .select('*')
      .single();
    
    if (quizError) {
      console.error('Error creating quiz:', quizError);
      throw new Error(`Failed to create quiz: ${quizError.message}`);
    }
    
    console.log(`Created quiz with ID: ${quiz.id}`);

    // Use AIEmbeddingService to store quiz questions with embeddings
    await storeQuizQuestionsWithEmbeddings(parsedResponse.questions, quiz.id);
    
    // Fetch created quiz with questions
    const { data: fullQuiz, error: fullQuizError } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions:quiz_questions(*)
      `)
      .eq('id', quiz.id)
      .single();
      
    if (fullQuizError) {
      console.error('Error fetching full quiz:', fullQuizError);
      // Return the original quiz if we can't fetch the full one
      return quiz;
    }
    
    return fullQuiz;
  } catch (error) {
    console.error('Error storing generated quiz:', error);
    throw error;
  }
}

/**
 * Store quiz questions with vector embeddings for similarity search
 */
export async function storeQuizQuestionsWithEmbeddings(questions: any[], quizId: string): Promise<string[]> {
  // Use AIEmbeddingService to store quiz questions with embeddings
  const embeddingService = new AIEmbeddingService();
  const questionIds: string[] = [];
  
  // Process each question and store with vector embedding
  for (const question of questions) {
    try {
      const questionId = await embeddingService.createQuizQuestionWithEmbedding(question, quizId);
      if (questionId) {
        questionIds.push(questionId);
      }
    } catch (questionError) {
      console.error('Error creating question with embedding:', questionError);
      // Continue with other questions even if one fails
    }
  }
  
  console.log(`Created ${questionIds.length} questions with embeddings`);
  return questionIds;
}

/**
 * Fetches quizzes by workspace ID
 */
export const getQuizzesByWorkspace = async (workspaceId: string, token?: string): Promise<Quiz[]> => {
  console.log(`Starting getQuizzesByWorkspace with workspaceId: ${workspaceId}`);

  try {
    // Get authenticated client if token is provided
    const client = token ? await getAuthenticatedClient(token) : supabase;

    // Query quizzes by workspace ID
    const { data, error } = await client
      .from('quizzes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log(`No quizzes found for workspace: ${workspaceId}`);
      return [];
    }

    console.log(`Found ${data.length} quizzes for workspace: ${workspaceId}`);

    // Transform the data to match our Quiz interface
    return data.map(quiz => ({
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