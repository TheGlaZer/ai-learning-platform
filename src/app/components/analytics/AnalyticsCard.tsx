import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface AnalyticsCardProps {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}

const Card = styled.div`
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ 
  title, 
  children,
  className = ''
}) => {
  return (
    <Card className={className}>
      <CardTitle>
        {title}
      </CardTitle>
      {children}
    </Card>
  );
}; 