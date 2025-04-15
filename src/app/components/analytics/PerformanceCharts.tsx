// This component now uses colors from the theme and translations
import React from 'react';
import styled from '@emotion/styled';
import { UserPerformanceAnalytics, SubjectPerformance } from '@/app/models/quizAnswer';
import { AnalyticsCard } from './AnalyticsCard';
import { PercentageSlider } from './PercentageSlider';
import { SubjectDistributionChart } from './SubjectDistributionChart';
import { useTranslations } from 'next-intl';
import * as colors from '../../../../colors';

interface PerformanceChartsProps {
  analytics: UserPerformanceAnalytics;
  getSubjectName: (subjectId: string) => string;
}

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr;
  }

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const SliderStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const EmptyMessage = styled.p`
  color: ${colors.text.secondary};
  background-color: ${colors.background.lighter};
  padding: 2rem;
  border-radius: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
`;

const SubjectBarSection = styled.div`
  overflow-y: auto;
  max-height: 450px;
  padding-right: 1rem;
  scrollbar-width: thin;
  scrollbar-color: ${colors.primary.light} ${colors.background.lighter};
  
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${colors.background.lighter};
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${colors.primary.light};
    border-radius: 10px;
  }
`;

const ScrollHint = styled.div`
  font-size: 0.75rem;
  color: ${colors.text.secondary};
  text-align: center;
  margin-top: 0.5rem;
  font-style: italic;
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  th, td {
    padding: 0.75rem 0.5rem;
    text-align: left;
  }
  
  th {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
  }
  
  tbody tr {
    border-bottom: 1px solid #e5e7eb;
    
    &:hover {
      background-color: #f9fafb;
    }
  }
`;

const TableCell = styled.td`
  white-space: nowrap;
`;

const QuizName = styled.div`
  font-weight: 500;
  color: #111827;
`;

const DateCell = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const TimeSpan = styled.span`
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
`;

const ScoreValue = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
`;

interface StatusBadgeProps {
  $color: 'green' | 'blue' | 'yellow' | 'red';
}

const StatusBadge = styled.span<StatusBadgeProps>`
  padding: 0 0.5rem;
  display: inline-flex;
  font-size: 0.75rem;
  line-height: 1.25rem;
  font-weight: 600;
  border-radius: 9999px;
  
  ${({ $color }) => {
    switch ($color) {
      case 'green':
        return `
          background-color: #dcfce7;
          color: #166534;
        `;
      case 'blue':
        return `
          background-color: #dbeafe;
          color: #1e40af;
        `;
      case 'yellow':
        return `
          background-color: #fef9c3;
          color: #854d0e;
        `;
      case 'red':
        return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #1f2937;
        `;
    }
  }}
`;

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ 
  analytics,
  getSubjectName
}) => {
  const t = useTranslations('Analytics');
  
  if (!analytics || !analytics.subjectPerformance.length) {
    return (
      <AnalyticsCard title={t('subjectPerformanceTitle')}>
        <EmptyMessage>
          {t('notEnoughData')}
        </EmptyMessage>
      </AnalyticsCard>
    );
  }

  // Sort subjects by score
  const sortedSubjects = [...analytics.subjectPerformance].sort((a, b) => b.score - a.score);
  
  // Get color based on score
  const getScoreColor = (score: number): 'green' | 'blue' | 'yellow' | 'red' => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'blue';
    if (score >= 0.4) return 'yellow';
    return 'red';
  };
  
  const showScrollHint = sortedSubjects.length > 5;
  
  return (
    <ChartsContainer>
      <AnalyticsCard title={t('subjectPerformanceTitle')}>
        <SubjectBarSection>
          <SliderStack>
            {sortedSubjects.map(subject => (
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
        </SubjectBarSection>
        {showScrollHint && (
          <ScrollHint>Scroll to see more subjects</ScrollHint>
        )}
      </AnalyticsCard>
      
      <SubjectDistributionChart 
        subjects={sortedSubjects} 
        getSubjectName={getSubjectName}
      />
      
      <AnalyticsCard title="Quiz History">
        {analytics.recentSubmissions.length > 0 ? (
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentSubmissions.map(submission => {
                  const scoreColor = getScoreColor(submission.score);
                  const scorePercentage = Math.round(submission.score * 100);
                  const quizName = `Quiz ${submission.quizId.substring(0, 8)}`;
                  
                  return (
                    <tr key={submission.id}>
                      <TableCell>
                        <QuizName>{quizName}</QuizName>
                      </TableCell>
                      <TableCell>
                        <DateCell>
                          {new Date(submission.completedAt || '').toLocaleDateString()} 
                          <TimeSpan>
                            {new Date(submission.completedAt || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </TimeSpan>
                        </DateCell>
                      </TableCell>
                      <TableCell>
                        <ScoreValue>{scorePercentage}%</ScoreValue>
                      </TableCell>
                      <TableCell>
                        <StatusBadge $color={scoreColor}>
                          {scorePercentage >= 80 ? 'Excellent' : 
                           scorePercentage >= 60 ? 'Good' : 
                           scorePercentage >= 40 ? 'Fair' : 'Needs Improvement'}
                        </StatusBadge>
                      </TableCell>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyMessage>No quiz history available yet.</EmptyMessage>
        )}
      </AnalyticsCard>
    </ChartsContainer>
  );
}; 