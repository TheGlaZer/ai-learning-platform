import React from 'react';
import styled from '@emotion/styled';
import { Skeleton } from '@mui/material';
import { AnalyticsCard } from './AnalyticsCard';

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

const StyledSkeleton = styled(Skeleton)`
  border-radius: 0.5rem;
`;

const SkeletonStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ChartContainer = styled.div`
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const ChartContent = styled.div`
  margin: 1rem 0;
  display: flex;
  justify-content: center;
`;

export const AnalyticsLoading: React.FC = () => {
  return (
    <LoadingContainer>
      {/* Performance Overview Loading */}
      <AnalyticsCard title={<Skeleton width={180} />}>
        <GridContainer>
          <div>
            <StyledSkeleton variant="rectangular" height={120} />
          </div>
          <div>
            <StyledSkeleton variant="rectangular" height={120} />
          </div>
        </GridContainer>
        
        <Skeleton variant="text" width="30%" height={32} />
        <SkeletonStack>
          <StyledSkeleton variant="rectangular" height={70} />
          <StyledSkeleton variant="rectangular" height={70} />
          <StyledSkeleton variant="rectangular" height={70} />
        </SkeletonStack>
        
        <Skeleton variant="text" width="25%" height={32} style={{ marginTop: '2rem' }} />
        <SkeletonStack>
          <StyledSkeleton variant="rectangular" height={70} />
          <StyledSkeleton variant="rectangular" height={70} />
        </SkeletonStack>
      </AnalyticsCard>
      
      {/* Performance Charts Loading */}
      <AnalyticsCard title={<Skeleton width={220} />}>
        <SkeletonStack>
          {[1, 2, 3, 4].map(i => (
            <StyledSkeleton key={i} variant="rectangular" height={70} />
          ))}
        </SkeletonStack>
      </AnalyticsCard>
      
      {/* Subject Distribution Chart Loading */}
      <ChartContainer>
        <Skeleton variant="text" width="40%" height={32} />
        <ChartContent>
          <Skeleton variant="circular" width={260} height={260} />
        </ChartContent>
        <Skeleton variant="text" width="70%" style={{ margin: '0 auto' }} />
      </ChartContainer>
      
      {/* Quiz History Loading */}
      <AnalyticsCard title={<Skeleton width={150} />}>
        <StyledSkeleton variant="rectangular" height={270} />
      </AnalyticsCard>
    </LoadingContainer>
  );
}; 