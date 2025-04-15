'use server';

import { supabase, getAuthenticatedClient } from './supabaseClient';
import { Quiz } from '@/app/models/quiz';
import { Subject } from '@/app/models/subject';
import { 
  QuestionAnswer, 
  QuizSubmission, 
  SubjectPerformance, 
  SubmitQuizAnswersParams,
  UserPerformanceAnalytics
} from '@/app/models/quizAnswer';
import { getQuizById } from './quizService';

/**
 * Submits quiz answers and updates subject performance metrics
 */
export const submitQuizAnswers = async (params: SubmitQuizAnswersParams): Promise<QuizSubmission> => {
  try {
    if (!params.token) {
      throw new Error('Authentication token is required for submitting quiz answers');
    }

    const client = await getAuthenticatedClient(params.token);
    
    // Get the quiz to calculate correct answers and gather subject mappings
    const quiz = await getQuizById(params.quizId, params.token);
    
    // Calculate score
    let correctCount = 0;
    for (const answer of params.answers) {
      // Find the question in the quiz
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (!question) continue;
      
      // Mark if the answer is correct
      answer.isCorrect = question.correctAnswer === answer.selectedOptionId;
      if (answer.isCorrect) correctCount++;
    }
    
    const score = params.answers.length > 0 ? correctCount / params.answers.length : 0;
    
    // Create quiz submission record
    const submission: QuizSubmission = {
      quizId: params.quizId,
      userId: params.userId,
      workspaceId: params.workspaceId,
      answers: params.answers,
      score,
      completedAt: new Date().toISOString()
    };
    
    // Insert the submission - ensure UUID format for user and workspace IDs
    const { data, error } = await client
      .from('quiz_submissions')
      .insert([
        {
          quiz_id: submission.quizId,
          user_id: submission.userId,
          workspace_id: submission.workspaceId,
          answers: submission.answers,
          score: submission.score,
          completed_at: submission.completedAt
        }
      ])
      .select('*')
      .single();
    
    if (error) {
      console.error('Error submitting quiz answers:', error);
      throw error;
    }
    
    // Transform the data to match our QuizSubmission interface
    const result: QuizSubmission = {
      id: data.id,
      quizId: data.quiz_id,
      userId: data.user_id,
      workspaceId: data.workspace_id,
      answers: data.answers,
      score: data.score,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    // Update subject performance metrics
    await updateSubjectPerformance(
      quiz, 
      params.answers, 
      params.userId, 
      params.workspaceId, 
      params.token
    );
    
    return result;
  } catch (error: any) {
    console.error('Error in submitQuizAnswers:', error);
    throw error;
  }
};

/**
 * Updates subject performance metrics based on quiz answers
 */
const updateSubjectPerformance = async (
  quiz: Quiz,
  answers: QuestionAnswer[],
  userId: string,
  workspaceId: string,
  token: string
) => {
  try {
    const client = await getAuthenticatedClient(token);
    
    // Map questions to subjects if the quiz has selectedSubjects
    if (!quiz.selectedSubjects || quiz.selectedSubjects.length === 0) {
      return; // No subjects to track
    }
    
    // Fetch subject information to map between names and IDs
    const { data: subjects, error: subjectsError } = await client
      .from('subjects')
      .select('id, name')
      .in('id', quiz.selectedSubjects)
      .eq('workspace_id', workspaceId);
    
    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError);
      // Continue with limited functionality
    }
    
    // Create mappings for easy lookup
    const subjectNameToId = new Map<string, string>();
    if (subjects) {
      subjects.forEach(subject => {
        subjectNameToId.set(subject.name, subject.id);
      });
    }
    
    // Get the full questions from the quiz to access relatedSubject field
    const subjectPerformanceMap = new Map<string, { correct: number, total: number }>();
    
    // Process each answer
    for (const answer of answers) {
      // Find the corresponding question in the quiz
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (!question) continue;
      
      // Determine which subject this question belongs to
      let subjectId: string | undefined;
      
      // First try to use the relatedSubject field if available
      if (question.relatedSubject) {
        // Try to map the subject name to ID
        subjectId = subjectNameToId.get(question.relatedSubject);
        
        // If name lookup failed, try direct ID match (in case relatedSubject contains an ID)
        if (!subjectId && quiz.selectedSubjects.includes(question.relatedSubject)) {
          subjectId = question.relatedSubject;
        }
      }
      
      // If no relatedSubject or matching ID found, fall back to using subjectIds from the answer if available
      if (!subjectId && answer.subjectIds && answer.subjectIds.length > 0) {
        subjectId = answer.subjectIds[0]; // Use the first subject ID
      }
      
      // If still no subject found, use all selected subjects (fallback to original behavior)
      if (!subjectId) {
        // Update metrics for all subjects in the quiz
        for (const id of quiz.selectedSubjects) {
          const current = subjectPerformanceMap.get(id) || { correct: 0, total: 0 };
          current.total += 1;
          if (answer.isCorrect) current.correct += 1;
          subjectPerformanceMap.set(id, current);
        }
      } else {
        // Update metrics just for the specific subject
        const current = subjectPerformanceMap.get(subjectId) || { correct: 0, total: 0 };
        current.total += 1;
        if (answer.isCorrect) current.correct += 1;
        subjectPerformanceMap.set(subjectId, current);
      }
    }
    
    // Now update the database for each subject
    for (const [subjectId, performance] of Array.from(subjectPerformanceMap.entries())) {
      const { correct: correctAnswers, total: totalQuestions } = performance;
      if (totalQuestions === 0) continue;
      
      const score = correctAnswers / totalQuestions;
      
      // First, check if a performance record exists for this subject
      const { data: existingData, error: existingError } = await client
        .from('subject_performance')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .maybeSingle();
      
      if (existingError) {
        console.error('Error fetching existing subject performance:', existingError);
        continue;
      }
      
      if (existingData) {
        // Update existing record
        const newCorrectAnswers = existingData.correct_answers + correctAnswers;
        const newTotalQuestions = existingData.total_questions + totalQuestions;
        const newScore = newCorrectAnswers / newTotalQuestions;
        
        const { error: updateError } = await client
          .from('subject_performance')
          .update({
            correct_answers: newCorrectAnswers,
            total_questions: newTotalQuestions,
            score: newScore,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingData.id);
          
        if (updateError) {
          console.error('Error updating subject performance:', updateError);
        }
      } else {
        // Create new record
        const { error: insertError } = await client
          .from('subject_performance')
          .insert([
            {
              subject_id: subjectId,
              user_id: userId,
              workspace_id: workspaceId,
              correct_answers: correctAnswers,
              total_questions: totalQuestions,
              score: score,
              last_updated: new Date().toISOString()
            }
          ]);
          
        if (insertError) {
          console.error('Error inserting subject performance:', insertError);
        }
      }
    }
  } catch (error: any) {
    console.error('Error updating subject performance:', error);
    // Don't throw - allow quiz submission to succeed even if analytics fail
  }
};

/**
 * Gets user performance analytics including subject strengths/weaknesses
 */
export const getUserPerformanceAnalytics = async (
  userId: string, 
  workspaceId: string, 
  token: string
): Promise<UserPerformanceAnalytics> => {
  try {
    const client = await getAuthenticatedClient(token);
    
    // Get overall submission stats
    const { data: submissions, error: submissionsError } = await client
      .from('quiz_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .order('completed_at', { ascending: false });
    
    if (submissionsError) throw submissionsError;
    
    // Calculate overall score across all submissions
    const totalSubmissions = submissions?.length || 0;
    const overallScore = totalSubmissions > 0 
      ? submissions.reduce((sum, sub) => sum + sub.score, 0) / totalSubmissions 
      : 0;
    
    // Get subject performance metrics
    const { data: subjectPerformance, error: subjectError } = await client
      .from('subject_performance')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .order('score', { ascending: false });
    
    if (subjectError) throw subjectError;
    
    // Format the data to match our interfaces
    const formattedSubmissions: QuizSubmission[] = (submissions || []).slice(0, 5).map(sub => ({
      id: sub.id,
      quizId: sub.quiz_id,
      userId: sub.user_id,
      workspaceId: sub.workspace_id,
      answers: sub.answers,
      score: sub.score,
      completedAt: sub.completed_at,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at
    }));
    
    const formattedPerformance: SubjectPerformance[] = (subjectPerformance || []).map(perf => ({
      id: perf.id,
      subjectId: perf.subject_id,
      userId: perf.user_id,
      workspaceId: perf.workspace_id,
      correctAnswers: perf.correct_answers,
      totalQuestions: perf.total_questions,
      score: perf.score,
      lastUpdated: perf.last_updated
    }));
    
    // Identify weak and strong subjects (handle empty arrays gracefully)
    const sortedPerformance = [...formattedPerformance].sort((a, b) => a.score - b.score);
    const weakSubjects = sortedPerformance.slice(0, Math.min(3, sortedPerformance.length)); 
    const strongSubjects = [...sortedPerformance].reverse().slice(0, Math.min(3, sortedPerformance.length));
    
    return {
      overallScore,
      totalQuizzes: totalSubmissions,
      subjectPerformance: formattedPerformance,
      recentSubmissions: formattedSubmissions,
      weakSubjects,
      strongSubjects
    };
  } catch (error: any) {
    console.error('Error in getUserPerformanceAnalytics:', error);
    throw error;
  }
};

/**
 * Gets a specific quiz submission for a user
 */
export const getUserQuizSubmission = async (
  quizId: string,
  userId: string,
  workspaceId: string,
  token: string
): Promise<QuizSubmission | null> => {
  try {
    const client = await getAuthenticatedClient(token);
    
    // Get the most recent submission for this quiz by this user
    const { data, error } = await client
      .from('quiz_submissions')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching quiz submission:', error);
      throw error;
    }
    
    if (!data) return null;
    
    // Transform the data to match our QuizSubmission interface
    return {
      id: data.id,
      quizId: data.quiz_id,
      userId: data.user_id,
      workspaceId: data.workspace_id,
      answers: data.answers,
      score: data.score,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error: any) {
    console.error('Error in getUserQuizSubmission:', error);
    throw error;
  }
}; 