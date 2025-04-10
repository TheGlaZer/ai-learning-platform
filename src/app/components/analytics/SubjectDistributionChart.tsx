import React from 'react';
import styled from 'styled-components';
import { SubjectPerformance } from '@/app/models/quizAnswer';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface SubjectDistributionChartProps {
  subjects: SubjectPerformance[];
  getSubjectName: (subjectId: string) => string;
}

const ChartContainer = styled.div`
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const ChartMessage = styled.p`
  color: #4b5563;
`;

const PieChartWrapper = styled.div`
  width: 100%;
  height: 300px;
`;

const ChartFooter = styled.div`
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #4b5563;
  text-align: center;
`;

export const SubjectDistributionChart: React.FC<SubjectDistributionChartProps> = ({ 
  subjects,
  getSubjectName
}) => {
  if (!subjects || subjects.length === 0) {
    return (
      <ChartContainer>
        <ChartTitle>Subject Distribution</ChartTitle>
        <ChartMessage>
          Not enough data to display subject distribution.
          Complete more quizzes to see this chart.
        </ChartMessage>
      </ChartContainer>
    );
  }

  // Calculate total questions
  const totalQuestions = subjects.reduce((sum, subject) => sum + subject.totalQuestions, 0);
  
  // Generate chart data with friendly names
  const data = {
    labels: subjects.map(s => getSubjectName(s.subjectId)),
    datasets: [
      {
        data: subjects.map(s => s.totalQuestions),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 122, 90, 0.8)',
          'rgba(129, 78, 40, 0.8)',
          'rgba(99, 99, 255, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 122, 90, 1)',
          'rgba(129, 78, 40, 1)',
          'rgba(99, 99, 255, 1)',
        ],
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
            size: 12
          },
          padding: 20
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
          size: 14
        },
        bodyFont: {
          size: 13
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000
    },
    cutout: '0%', // Use 0% for a pie chart, or 50% for doughnut
    radius: '90%'
  };

  return (
    <ChartContainer>
      <ChartTitle>Subject Distribution</ChartTitle>
      <PieChartWrapper>
        <Pie data={data} options={options} />
      </PieChartWrapper>
      <ChartFooter>
        Distribution of {totalQuestions} questions across {subjects.length} subjects
      </ChartFooter>
    </ChartContainer>
  );
}; 