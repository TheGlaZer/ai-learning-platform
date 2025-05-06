import { supabase, getAuthenticatedClient } from "./supabaseClient";
import { Pattern } from "../models/pattern";
import { extractTextFromFile } from "./textExtractService";
import { AIServiceFactory } from "./ai/AIServiceFactory";
import { AIConfig } from "./ai/AIConfig";
import { PastExam } from "../models/pastExam";

/**
 * Fetches all patterns for a specific workspace
 */
export const getPatternsByWorkspace = async (workspaceId: string, token?: string): Promise<Pattern[]> => {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    const { data, error } = await client
      .from('patterns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching patterns:", error);
      throw error;
    }
    
    return data as Pattern[];
  } catch (error) {
    console.error("Error in getPatternsByWorkspace:", error);
    throw error;
  }
};

/**
 * Fetches patterns related to a specific past exam
 */
export const getPatternsByPastExam = async (pastExamId: string, token?: string): Promise<Pattern[]> => {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    const { data, error } = await client
      .from('patterns')
      .select('*')
      .eq('past_exam_id', pastExamId)
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching patterns for past exam:", error);
      throw error;
    }
    
    return data as Pattern[];
  } catch (error) {
    console.error("Error in getPatternsByPastExam:", error);
    throw error;
  }
};

/**
 * Fetches a specific pattern by ID
 */
export const getPatternById = async (patternId: string, token?: string): Promise<Pattern | null> => {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    const { data, error } = await client
      .from('patterns')
      .select('*')
      .eq('id', patternId)
      .single();
    
    if (error) {
      console.error("Error fetching pattern by ID:", error);
      throw error;
    }
    
    return data as Pattern;
  } catch (error) {
    console.error("Error in getPatternById:", error);
    return null;
  }
};

/**
 * Creates a new pattern
 */
export const createPattern = async (pattern: Omit<Pattern, 'id' | 'created_at' | 'updated_at'>, token?: string): Promise<Pattern> => {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    const { data, error } = await client
      .from('patterns')
      .insert([pattern])
      .select('*')
      .single();
    
    if (error) {
      console.error("Error creating pattern:", error);
      throw error;
    }
    
    return data as Pattern;
  } catch (error) {
    console.error("Error in createPattern:", error);
    throw error;
  }
};

/**
 * Updates an existing pattern
 */
export const updatePattern = async (patternId: string, updates: Partial<Pattern>, token?: string): Promise<Pattern> => {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    const { data, error } = await client
      .from('patterns')
      .update(updates)
      .eq('id', patternId)
      .select('*')
      .single();
    
    if (error) {
      console.error("Error updating pattern:", error);
      throw error;
    }
    
    return data as Pattern;
  } catch (error) {
    console.error("Error in updatePattern:", error);
    throw error;
  }
};

/**
 * Deletes a pattern
 */
export const deletePattern = async (patternId: string, token?: string): Promise<boolean> => {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    const { error } = await client
      .from('patterns')
      .delete()
      .eq('id', patternId);
    
    if (error) {
      console.error("Error deleting pattern:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deletePattern:", error);
    return false;
  }
};

/**
 * Generates pattern data for a past exam
 */
export const generatePatternForPastExam = async (
  pastExam: PastExam,
  userId: string,
  workspaceId: string,
  token?: string
): Promise<Pattern> => {
  try {
    // Extract file path from the URL
    const url = pastExam.url;
    const filePath = url.includes('files/') 
      ? url.split('files/')[1] 
      : url;
    
    // Download the file
    const client = token ? await getAuthenticatedClient(token) : supabase;
    const { data: fileData, error: fileError } = await client.storage
      .from('files')
      .download(filePath);
    
    if (fileError || !fileData) {
      console.error("Error downloading past exam file:", fileError);
      throw new Error('Failed to download past exam file');
    }
    
    // Get file extension and type
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const mimeType = getMimeTypeFromExtension(fileExtension);
    
    // Extract text from the file
    const arrayBuffer = await fileData.arrayBuffer();
    const extractedText = await extractTextFromFile(
      arrayBuffer,
      mimeType,
      filePath.split('/').pop() || 'past_exam',
      { language: 'auto', addPageMarkers: true }
    );
    
    // Use AI to analyze the content and extract patterns
    const aiService = AIServiceFactory.getService(AIConfig.defaultProvider);
    const patternData = await aiService.generateExamPatterns(extractedText, {
      examName: pastExam.name,
      examYear: pastExam.year,
      examSemester: pastExam.semester,
      examCourse: pastExam.course,
    });
    
    // Create a new pattern record
    const newPattern = {
      name: `${pastExam.name} Pattern`,
      past_exam_id: pastExam.id,
      workspace_id: workspaceId,
      user_id: userId,
      pattern_data: patternData,
      confidence_score: patternData.confidence_metrics.overall_exam_predictability,
      usage_count: 0,
      active: true
    };
    
    return await createPattern(newPattern, token);
  } catch (error) {
    console.error("Error generating pattern:", error);
    throw error;
  }
};

/**
 * Formats pattern data for inclusion in quiz generation prompts
 */
export const formatPatternForPrompt = (patterns: Pattern[]): string => {
  if (!patterns || patterns.length === 0) return '';
  
  let patternPrompt = `
  
EXAM PATTERNS TO FOLLOW:
Based on analysis of past exams, incorporate these patterns into the generated quiz to create an authentic exam experience:
`;

  patterns.forEach(pattern => {
    // Format question type distribution
    patternPrompt += `\n- Question types distribution: ${formatDistribution(pattern.pattern_data.question_formats)}`;
    
    // Add high-priority topics based on exam frequency
    patternPrompt += `\n- Prioritize these high-value topics: ${getHighValueTopics(pattern.pattern_data.topic_distribution)}`;
    
    // Add difficulty progression guidance
    patternPrompt += `\n- Follow this difficulty progression: ${formatDifficultyCurve(pattern.pattern_data.exam_structure.difficulty_progression)}`;
    
    // Add key terminology and concepts to incorporate
    patternPrompt += `\n- Include these key concepts and terminology: ${formatRecurringConcepts(pattern.pattern_data.key_insights.recurring_concepts)}`;
  });
  
  return patternPrompt;
};

/**
 * Helper function to format distribution data
 */
function formatDistribution(distribution: Record<string, number>): string {
  return Object.entries(distribution)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => `${key.replace(/_/g, ' ')} (${Math.round(value)}%)`)
    .join(', ');
}

/**
 * Helper function to extract high-value topics
 */
function getHighValueTopics(topicDistribution: Record<string, { frequency: number, average_points: number, importance_score: number }>): string {
  return Object.entries(topicDistribution)
    .sort((a, b) => b[1].importance_score - a[1].importance_score)
    .slice(0, 5)
    .map(([topic, data]) => `${topic} (importance: ${data.importance_score.toFixed(2)})`)
    .join(', ');
}

/**
 * Helper function to format difficulty curve
 */
function formatDifficultyCurve(progression: { beginning: string, middle: string, end: string }): string {
  return `starting with ${progression.beginning} questions, then ${progression.middle} in the middle, and ${progression.end} towards the end`;
}

/**
 * Helper function to format recurring concepts
 */
function formatRecurringConcepts(concepts: { concept: string, frequency: number }[]): string {
  return concepts
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 7)
    .map(item => item.concept)
    .join(', ');
}

/**
 * Helper function to determine MIME type from file extension
 */
function getMimeTypeFromExtension(extension?: string): string {
  if (!extension) return 'application/octet-stream';
  
  switch (extension.toLowerCase()) {
    case 'pdf':
      return 'application/pdf';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    default:
      return 'application/octet-stream';
  }
} 