import { supabase } from './supabaseClient';
import { Quiz, QuizGenerationParams } from '@/app/models/quiz';
import { AIServiceFactory } from './ai/AIServiceFactory';
import { FileMetadata } from '@/app/models/file';

/**
 * Creates a quiz in the database and returns the result
 */
export const createQuiz = async (quiz: Quiz): Promise<Quiz> => {
  const { data, error } = await supabase
    .from('quizzes')
    .insert([
      {
        title: quiz.title,
        questions: quiz.questions,
        file_id: quiz.fileId,
        workspace_id: quiz.workspaceId,
        user_id: quiz.userId,
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
  };
};

/**
 * Fetches a file's content by its ID
 */
export const getFileContent = async (fileId: string): Promise<{ file: FileMetadata; content: string }> => {
  // Get file metadata
  const { data: fileData, error: fileError } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (fileError) {
    console.error('Error fetching file:', fileError);
    throw fileError;
  }

  // Get file URL and fetch content
  const filePath = fileData.url.split('/').pop();
  const { data, error } = await supabase.storage.from('files').download(`files/${filePath}`);

  if (error) {
    console.error('Error downloading file:', error);
    throw error;
  }

  // Convert file data to text
  const content = await data.text();

  return {
    file: {
      id: fileData.id,
      name: fileData.name,
      url: fileData.url,
      fileType: fileData.file_type,
      userId: fileData.user_id,
      workspaceId: fileData.workspace_id,
      createdAt: fileData.created_at,
    },
    content,
  };
};

/**
 * Generates a quiz based on a file's content using AI
 */
export const generateQuiz = async (params: QuizGenerationParams): Promise<Quiz> => {
  try {
    // Get file content
    const { file, content } = await getFileContent(params.fileId);

    // Use AI factory to get the appropriate service
    const aiService = AIServiceFactory.createService(
      (params.aiProvider as any) || 'openai'
    );

    // Generate quiz content with AI
    const response = await aiService.generateQuiz(
      content,
      params.topic,
      params.numberOfQuestions,
      params.difficultyLevel
    );

    // Parse the response into a quiz structure
    let quizData: Quiz;
    
    try {
      const parsedContent = JSON.parse(response.content);
      quizData = {
        title: parsedContent.title,
        questions: parsedContent.questions,
        fileId: params.fileId,
        workspaceId: params.workspaceId,
        userId: params.userId,
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI-generated quiz');
    }

    // Store the quiz in the database
    return await createQuiz(quizData);
  } catch (error) {
    console.error('Error in quiz generation:', error);
    throw error;
  }
};

/**
 * Fetches quizzes by workspace ID
 */
export const getQuizzesByWorkspace = async (workspaceId: string): Promise<Quiz[]> => {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }

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
  }));
};

/**
 * Gets a quiz by ID
 */
export const getQuizById = async (quizId: string): Promise<Quiz> => {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single();

  if (error) {
    console.error('Error fetching quiz:', error);
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
  };
};