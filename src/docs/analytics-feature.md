# Quiz Analytics Feature

This document describes the quiz analytics feature that tracks user performance across quizzes and subjects.

## Overview

The analytics feature enables:

1. Tracking user answers when they submit quizzes
2. Associating answers with specific subjects
3. Calculating performance metrics by subject
4. Visualizing user progress and identifying strengths/weaknesses
5. Presenting analytics in an easy-to-understand dashboard

## Database Schema

Two main tables were added to support this feature:

### Quiz Submissions
Stores individual quiz submissions with user answers:
- `id`: Unique identifier
- `quiz_id`: Reference to the quiz
- `user_id`: User who submitted the quiz
- `workspace_id`: Workspace context  
- `answers`: JSON array of question answers (includes correctness)
- `score`: Overall score (0-1)
- `completed_at`: When the quiz was completed
- Standard timestamps

### Subject Performance
Aggregates performance metrics by subject:
- `id`: Unique identifier
- `subject_id`: Reference to the subject
- `user_id`: User being tracked
- `workspace_id`: Workspace context
- `correct_answers`: Count of correct answers for this subject
- `total_questions`: Count of total questions for this subject
- `score`: Ratio of correct to total (0-1)
- `last_updated`: When metrics were last updated
- Standard timestamps

## Components

### Backend
- `QuestionAnswer` and related interfaces in `src/app/models/quizAnswer.ts`
- `quizAnswerService.ts` with functions to:
  - Submit quiz answers
  - Update subject performance
  - Retrieve analytics data
- API endpoints:
  - `POST /api/quiz-answers` for submitting answers
  - `GET /api/analytics` for retrieving performance data

### Frontend
- React hooks:
  - `useQuizAnswers` - For submitting answers
  - `usePerformanceAnalytics` - For fetching analytics data
- UI Components:
  - `PerformanceOverview` - Summary stats
  - `PerformanceCharts` - Visualizations
- Integration with quiz components:
  - Automatic submission on quiz completion
  - Success/error feedback

## How It Works

1. **Quiz Submission**:
   - When a user completes a quiz, their answers are automatically submitted to the backend
   - Each answer is evaluated for correctness and associated with subjects
   - Overall quiz score is calculated

2. **Performance Tracking**:
   - For each subject in the quiz, the system updates aggregated metrics
   - If a subject performance record exists, it's updated with new data
   - Otherwise, a new record is created

3. **Analytics Display**:
   - The analytics dashboard fetches user performance data
   - Displays overall score and subject-specific metrics
   - Highlights strengths and areas for improvement
   - Shows quiz history

## Usage

### Viewing Analytics
- Navigate to the Analytics page from the main navigation
- The system automatically fetches your performance data
- View your overall score and performance by subject
- See which subjects need improvement

### Interpreting Results
- Overall score: Average across all quizzes
- Subject scores: Performance in specific knowledge areas
- Weak subjects: Topics scoring below average
- Strong subjects: Topics with high proficiency

## Future Enhancements

Planned improvements:
- Time-based progress tracking
- More detailed question analysis
- Recommended learning paths based on weak areas
- Custom report generation
- Printable performance certificates 