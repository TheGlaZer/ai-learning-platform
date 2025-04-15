import React from 'react';
import styled from '@emotion/styled';
import { SubjectPerformance } from '@/app/models/quizAnswer';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useTranslations } from 'next-intl';
import * as colors from '../../../../colors';

// Register required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface SubjectDistributionChartProps {
  subjects: SubjectPerformance[];
  getSubjectName: (subjectId: string) => string;
}

const ChartContainer = styled.div`
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  
  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: ${colors.text.primary};
`;

const ChartMessage = styled.p`
  color: ${colors.text.secondary};
  padding: 2rem 0;
  text-align: center;
`;

const PieChartWrapper = styled.div`
  width: 100%;
  height: 320px;
  margin: 0 auto;
  max-width: 500px;
`;

const ChartFooter = styled.div`
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: ${colors.text.secondary};
  text-align: center;
  padding-top: 0.5rem;
  border-top: 1px solid ${colors.border.light};
`;

export const SubjectDistributionChart: React.FC<SubjectDistributionChartProps> = ({ 
  subjects,
  getSubjectName
}) => {
  const t = useTranslations('Analytics');

  if (!subjects || subjects.length === 0) {
    return (
      <ChartContainer>
        <ChartTitle>{t('subjectDistributionTitle')}</ChartTitle>
        <ChartMessage>
          {t('notEnoughData')}
        </ChartMessage>
      </ChartContainer>
    );
  }

  // Calculate total questions
  const totalQuestions = subjects.reduce((sum, subject) => sum + subject.totalQuestions, 0);
  
  // Generate vibrant colors based on theme colors
  const generateColors = (count: number) => {
    const baseColors = [
      colors.primary.main,
      colors.secondary.main,
      colors.accent.purple.main,
      colors.accent.green.main,
      colors.accent.yellow.main,
      colors.primary.light,
      colors.secondary.light,
      colors.accent.purple.light,
      colors.accent.green.light,
      colors.accent.yellow.light,
    ];
    
    // If we need more colors than we have in our base set, generate additional ones
    const result = [...baseColors];
    
    while (result.length < count) {
      result.push(baseColors[result.length % baseColors.length]);
    }
    
    return {
      backgrounds: result.map(color => `${color}CC`), // Add some transparency
      borders: result.map(color => color)
    };
  };
  
  const { backgrounds, borders } = generateColors(subjects.length);
  
  // Generate chart data with friendly names
  const data = {
    labels: subjects.map(s => getSubjectName(s.subjectId)),
    datasets: [
      {
        data: subjects.map(s => s.totalQuestions),
        backgroundColor: backgrounds,
        borderColor: borders,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            size: 12,
            family: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
          },
          padding: 20,
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const percentage = Math.round((value / totalQuestions) * 100);
            return `${context.label}: ${value} questions (${percentage}%)`;
          }
        },
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          family: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1200
    },
    cutout: '0%', // Use 0% for a pie chart, or 50% for doughnut
    radius: '85%'
  };

  return (
    <ChartContainer>
      <ChartTitle>{t('subjectDistributionTitle')}</ChartTitle>
      <PieChartWrapper>
        <Pie data={data} options={options} />
      </PieChartWrapper>
      <ChartFooter>
        {t('questionsDistributionFooter', { total: totalQuestions, count: subjects.length })}
      </ChartFooter>
    </ChartContainer>
  );
}; 