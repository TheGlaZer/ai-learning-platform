// This component now uses colors from the theme and translations
import React from 'react';
import styled from '@emotion/styled';
import { UserPerformanceAnalytics } from '@/app/models/quizAnswer';
import { PercentageSlider } from './PercentageSlider';
import { AnalyticsCard } from './AnalyticsCard';
import { useTranslations } from 'next-intl';
import * as colors from '../../../../colors';

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
  background-color: ${colors.border.light};
  border-radius: 0.5rem;
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
  background-color: rgba(151, 118, 255, 0.08); // accent.purple with alpha
  padding: 1.25rem;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 10px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const SubjectTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: ${colors.text.primary};
`;

const SubjectStats = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
`;

const SubjectCount = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${colors.accent.purple.main};
  line-height: 1;
`;

const SubjectLabel = styled.div`
  font-size: 0.875rem;
  color: ${colors.text.secondary};
  margin-bottom: 0.25rem;
`;

const SubjectDescription = styled.div`
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: ${colors.text.secondary};
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  color: ${colors.text.primary};
  position: relative;
  padding-left: 1rem;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: ${colors.primary.main};
    border-radius: 4px;
  }
`;

const SectionContainer = styled.div`
  margin-bottom: 2.5rem;
  
  &:last-of-type {
    margin-bottom: 0;
  }
`;

const SliderStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EmptyMessage = styled.p`
  color: ${colors.text.secondary};
  background-color: ${colors.background.lighter};
  padding: 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  text-align: center;
`;

export const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({
  analytics,
  isLoading = false,
  getSubjectName
}) => {
  const t = useTranslations('Analytics');
  
  if (isLoading) {
    return (
      <AnalyticsCard title={t('overallScore')}>
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
      <AnalyticsCard title={t('overallScore')}>
        <EmptyMessage>
          {t('noDataText')}
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
    <AnalyticsCard title={t('overallScore')}>
      <GridContainer>
        <PercentageSlider 
          label={t('overallScore')} 
          percentage={analytics.overallScore}
          color={getScoreColor(analytics.overallScore)}
          detail={t('basedOnQuizzes', { count: analytics.totalQuizzes })}
        />
        
        <SubjectKnowledgeCard>
          <SubjectTitle>{t('subjectKnowledge')}</SubjectTitle>
          <SubjectStats>
            <SubjectCount>
              {analytics.subjectPerformance.length}
            </SubjectCount>
            <SubjectLabel>
              {t('subjectsTracked')}
            </SubjectLabel>
          </SubjectStats>
          <SubjectDescription>
            {analytics.totalQuizzes > 0 
              ? t('keepTakingQuizzes')
              : t('takeQuizzesToStart')}
          </SubjectDescription>
        </SubjectKnowledgeCard>
      </GridContainer>
      
      <SectionContainer>
        <SectionTitle>{t('areasForImprovement')}</SectionTitle>
        {analytics.weakSubjects.length > 0 ? (
          <SliderStack>
            {analytics.weakSubjects.map((subject) => (
              <PercentageSlider
                key={subject.subjectId}
                label={getSubjectName(subject.subjectId)}
                percentage={subject.score}
                color={getScoreColor(subject.score)}
                detail={t('correctOf', { 
                  correct: subject.correctAnswers, 
                  total: subject.totalQuestions 
                })}
                tooltip={`Subject ID: ${subject.subjectId}`}
              />
            ))}
          </SliderStack>
        ) : (
          <EmptyMessage>{t('noWeakAreas')}</EmptyMessage>
        )}
      </SectionContainer>
      
      <SectionContainer>
        <SectionTitle>{t('yourStrengths')}</SectionTitle>
        {analytics.strongSubjects.length > 0 ? (
          <SliderStack>
            {analytics.strongSubjects.map((subject) => (
              <PercentageSlider
                key={subject.subjectId}
                label={getSubjectName(subject.subjectId)}
                percentage={subject.score}
                color={getScoreColor(subject.score)}
                detail={t('correctOf', { 
                  correct: subject.correctAnswers, 
                  total: subject.totalQuestions 
                })}
                tooltip={`Subject ID: ${subject.subjectId}`}
              />
            ))}
          </SliderStack>
        ) : (
          <EmptyMessage>{t('noStrengths')}</EmptyMessage>
        )}
      </SectionContainer>
    </AnalyticsCard>
  );
}; 