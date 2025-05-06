'use server';

// Import rather than re-export to comply with Next.js 'use server' requirements
import { generateQuiz as _generateQuiz } from './quizGenerationService';

import { 
  createQuiz as _createQuiz, 
  getQuizzesByWorkspace as _getQuizzesByWorkspace, 
  storeGeneratedQuiz as _storeGeneratedQuiz,
  storeQuizQuestionsWithEmbeddings as _storeQuizQuestionsWithEmbeddings
} from './quizStorage';

import { 
  validateFileSize as _validateFileSize, 
  validateUserInput as _validateUserInput,
  checkForDuplicates as _checkForDuplicates
} from './quizValidation';

import {
  getPreviousQuestions as _getPreviousQuestions,
  getSubjectNames as _getSubjectNames,
  updatePatternUsageCount as _updatePatternUsageCount,
  fetchExamPatterns as _fetchExamPatterns
} from './quizGenerationHelper';

// Re-export with proper async wrappers
// Quiz generation
export async function generateQuiz(...args: Parameters<typeof _generateQuiz>) {
  return _generateQuiz(...args);
}

// Quiz storage
export async function createQuiz(...args: Parameters<typeof _createQuiz>) {
  return _createQuiz(...args);
}

export async function getQuizzesByWorkspace(...args: Parameters<typeof _getQuizzesByWorkspace>) {
  return _getQuizzesByWorkspace(...args);
}

export async function storeGeneratedQuiz(...args: Parameters<typeof _storeGeneratedQuiz>) {
  return _storeGeneratedQuiz(...args);
}

export async function storeQuizQuestionsWithEmbeddings(...args: Parameters<typeof _storeQuizQuestionsWithEmbeddings>) {
  return _storeQuizQuestionsWithEmbeddings(...args);
}

// Quiz validation
export async function validateFileSize(...args: Parameters<typeof _validateFileSize>) {
  return _validateFileSize(...args);
}

export async function validateUserInput(...args: Parameters<typeof _validateUserInput>) {
  return _validateUserInput(...args);
}

export async function checkForDuplicates(...args: Parameters<typeof _checkForDuplicates>) {
  return _checkForDuplicates(...args);
}

// Quiz generation helpers
export async function getPreviousQuestions(...args: Parameters<typeof _getPreviousQuestions>) {
  return _getPreviousQuestions(...args);
}

export async function getSubjectNames(...args: Parameters<typeof _getSubjectNames>) {
  return _getSubjectNames(...args);
}

export async function updatePatternUsageCount(...args: Parameters<typeof _updatePatternUsageCount>) {
  return _updatePatternUsageCount(...args);
}

export async function fetchExamPatterns(...args: Parameters<typeof _fetchExamPatterns>) {
  return _fetchExamPatterns(...args);
} 