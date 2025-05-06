'use server';

import { FILE_SIZE_LIMITS, formatFileSize } from '@/hooks/useFileUpload';
import { getFileSizeFromId } from '../file/filesService';
import { validateUserInstructions } from '../securityService';

/**
 * Validates file size for quiz generation
 */
export const validateFileSize = async (fileId: string, token?: string): Promise<void> => {
  try {
    const fileInfo = await getFileSizeFromId(fileId, token);
    
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
};

/**
 * Validates user instructions for security issues
 */
export const validateUserInput = async (userComments?: string): Promise<void> => {
  if (!userComments) return;
  
  const instructionsValidation = validateUserInstructions(userComments);
  if (!instructionsValidation.valid) {
    console.error(`Security validation failed for user instructions: ${instructionsValidation.message}`);
    throw new Error(instructionsValidation.message || 'Invalid instructions detected');
  }
};

/**
 * Check for duplicate questions with what was previously generated
 */
export const checkForDuplicates = async (newQuestions: any[], previousQuestionsTexts: string[]): Promise<void> => {
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