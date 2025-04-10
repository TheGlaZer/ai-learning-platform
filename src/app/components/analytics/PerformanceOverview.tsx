import React from 'react';
import styled from 'styled-components';
import { UserPerformanceAnalytics } from '@/app/models/quizAnswer';
import { PercentageSlider } from './PercentageSlider';
import { AnalyticsCard } from './AnalyticsCard';

interface PerformanceOverviewProps {
  analytics: UserPerformanceAnalytics;
  isLoading?: boolean;
  getSubjectName: (subjectId: string) => string;
}

const LoadingPulse = styled.div`
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const LoadingBar = styled(LoadingPulse)<{ $height: string; $width?: string }>`
  height: ${props => props.$height};
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  width: ${props => props.$width || '100%'};
  margin-bottom: 1.5rem;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const SubjectKnowledgeCard = styled.div`
  background-color: #f3e8ff;
  padding: 1rem;
  border-radius: 0.5rem;
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
`;

const SubjectTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const SubjectStats = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
`;

const SubjectCount = styled.div`
  font-size: 2.25rem;
  font-weight: 700;
  color: #9333ea;
`;

const SubjectLabel = styled.div`
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.25rem;
`;

const SubjectDescription = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const SectionContainer = styled.div`
  margin-bottom: 2rem;
`;

const SliderStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EmptyMessage = styled.p`
  color: #4b5563;
`;

export const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({
  analytics,
  isLoading = false,
  getSubjectName
}) => {
  if (isLoading) {
    return (
      <AnalyticsCard title="Performance Overview">
        <LoadingPulse>
          <LoadingBar $height="1rem" $width="75%" />
          <LoadingBar $height="8rem" />
          <LoadingBar $height="1rem" $width="50%" />
          <LoadingBar $height="1rem" $width="66%" />
          <LoadingBar $height="8rem" />
        </LoadingPulse>
      </AnalyticsCard>
    );
  }

  if (!analytics) {
    return (
      <AnalyticsCard title="Performance Overview">
        <EmptyMessage>
          Complete some quizzes to see your performance analytics.
        </EmptyMessage>
      </AnalyticsCard>
    );
  }

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'blue';
    if (score >= 0.4) return 'yellow';
    return 'red';
  };

  return (
    <AnalyticsCard title="Performance Overview">
      <GridContainer>
        <PercentageSlider 
          label="Overall Score" 
          percentage={analytics.overallScore}
          color={getScoreColor(analytics.overallScore)}
          detail={`Based on ${analytics.totalQuizzes} quizzes`}
        />
        
        <SubjectKnowledgeCard>
          <SubjectTitle>Subject Knowledge</SubjectTitle>
          <SubjectStats>
            <SubjectCount>
              {analytics.subjectPerformance.length}
            </SubjectCount>
            <SubjectLabel>
              subjects tracked
            </SubjectLabel>
          </SubjectStats>
          <SubjectDescription>
            {analytics.totalQuizzes > 0 
              ? 'Keep taking quizzes to improve your tracking' 
              : 'Take quizzes to start tracking subjects'}
          </SubjectDescription>
        </SubjectKnowledgeCard>
      </GridContainer>
      
      <SectionContainer>
        <SectionTitle>Areas for Improvement</SectionTitle>
        {analytics.weakSubjects.length > 0 ? (
          <SliderStack>
            {analytics.weakSubjects.map((subject) => (
              <PercentageSlider
                key={subject.subjectId}
                label={getSubjectName(subject.subjectId)}
                percentage={subject.score}
                color={getScoreColor(subject.score)}
                detail={`${subject.correctAnswers} correct of ${subject.totalQuestions} questions`}
                tooltip={`Subject ID: ${subject.subjectId}`}
              />
            ))}
          </SliderStack>
        ) : (
          <EmptyMessage>No weak areas identified yet. Keep taking quizzes!</EmptyMessage>
        )}
      </SectionContainer>
      
      <SectionContainer>
        <SectionTitle>Your Strengths</SectionTitle>
        {analytics.strongSubjects.length > 0 ? (
          <SliderStack>
            {analytics.strongSubjects.map((subject) => (
              <PercentageSlider
                key={subject.subjectId}
                label={getSubjectName(subject.subjectId)}
                percentage={subject.score}
                color={getScoreColor(subject.score)}
                detail={`${subject.correctAnswers} correct of ${subject.totalQuestions} questions`}
                tooltip={`Subject ID: ${subject.subjectId}`}
              />
            ))}
          </SliderStack>
        ) : (
          <EmptyMessage>No strengths identified yet. Keep taking quizzes!</EmptyMessage>
        )}
      </SectionContainer>
    </AnalyticsCard>
  );
}; 