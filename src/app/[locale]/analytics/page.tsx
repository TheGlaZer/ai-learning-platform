'use client';

import React from 'react';
import styled, { css, keyframes } from '@emotion/styled';
import { PerformanceOverview } from '@/app/components/analytics/PerformanceOverview';
import { PerformanceCharts } from '@/app/components/analytics/PerformanceCharts';
import { UserPerformanceAnalytics } from '@/app/models/quizAnswer';
import AnalyticsLayout from '@/components/AnalyticsLayout';
import AuthGuard from '@/components/AuthGuard';
import { useAnalytics } from '@/app/lib-client/hooks/useAnalytics';
import { useSubjects } from '@/app/lib-client/hooks/useSubjects';
import { AnalyticsLoading } from '@/app/components/analytics/AnalyticsLoading';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useRouter } from 'next/navigation';

// Styled Components
const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1rem;
  
  @media (min-width: 640px) {
    padding: 2rem 1.5rem;
  }
  
  @media (min-width: 1024px) {
    padding: 2rem 2rem;
  }
`;

const Header = styled.header`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderContent = styled.div``;

const PageTitle = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
`;

const PageDescription = styled.p`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
`;

const WorkspaceInfo = styled.p`
  font-size: 0.875rem;
  color: #2563eb;
  margin-top: 0.25rem;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const RefreshButton = styled.button<{ $isLoading?: boolean }>`
  margin-left: 1rem;
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: #1d4ed8;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const RefreshIcon = styled.svg<{ $isSpinning?: boolean }>`
  height: 1rem;
  width: 1rem;
  margin-right: 0.5rem;
  
  ${props => props.$isSpinning && css`
    animation: ${spin} 1s linear infinite;
  `}
`;

const AlertContainer = styled.div<{ $type?: 'error' | 'auth' | 'warning' | 'info' }>`
  border: 1px solid;
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
  margin-bottom: 1.5rem;
  
  ${props => {
    switch (props.$type) {
      case 'auth':
        return css`
          background-color: #fef3c7;
          border-color: #f59e0b;
          color: #92400e;
        `;
      case 'error':
        return css`
          background-color: #fee2e2;
          border-color: #f87171;
          color: #b91c1c;
        `;
      case 'warning':
        return css`
          background-color: #fef3c7;
          border-color: #f59e0b;
          color: #92400e;
        `;
      case 'info':
        return css`
          background-color: #e0f2fe;
          border-color: #60a5fa;
          color: #1e40af;
        `;
      default:
        return css`
          background-color: #f3f4f6;
          border-color: #d1d5db;
          color: #111827;
        `;
    }
  }}
`;

const AlertTitle = styled.p`
  font-weight: 700;
`;

const AlertText = styled.p``;

const SignInButton = styled.button`
  margin-top: 0.5rem;
  background-color: #f59e0b;
  color: white;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  
  &:hover {
    background-color: #d97706;
  }
`;

const WorkspaceSelectAlert = styled.div`
  background-color: #eff6ff;
  border: 1px solid #93c5fd;
  color: #1e40af;
  padding: 1.25rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

const WorkspaceAlertTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const WorkspaceAlertText = styled.p`
  margin-bottom: 1rem;
`;

const WorkspaceAlertSmallText = styled.p`
  font-size: 0.875rem;
`;

const DashboardButton = styled.button`
  background-color: #2563eb;
  color: white;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  
  &:hover {
    background-color: #1d4ed8;
  }
`;

const AnalyticsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const NoDataContainer = styled.div`
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
`;

const NoDataTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const NoDataText = styled.p`
  color: #4b5563;
  margin-bottom: 1rem;
`;

const NoDataHint = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

export default function AnalyticsPage() {
  const router = useRouter();
  
  // Get the current workspace from context
  const { selectedWorkspace, workspaces, loading: workspacesLoading } = useWorkspace();
  
  const {
    analytics,
    isLoading,
    isInitialLoad,
    errorMessage,
    isAuthError,
    hasUser,
    hasWorkspace,
    handleRetryAuth,
    refreshAnalytics
  } = useAnalytics();
  
  // Load subjects data (hook will use selected workspace from context)
  const { getSubjectName, isLoading: subjectsLoading } = useSubjects();
  
  // Determine if we're loading any data
  const isLoadingData = isLoading || isInitialLoad || subjectsLoading || workspacesLoading;
  
  // Handle navigation to dashboard for workspace selection
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };
  
  return (
    <AnalyticsLayout>
      <AuthGuard>
        <Container>
          <Header>
            <HeaderContent>
              <PageTitle>Learning Analytics</PageTitle>
              <PageDescription>
                Track your progress and identify areas for improvement
              </PageDescription>
              {selectedWorkspace && (
                <WorkspaceInfo>
                  Workspace: {selectedWorkspace.name}
                </WorkspaceInfo>
              )}
            </HeaderContent>
            
            {hasUser && !isInitialLoad && selectedWorkspace && (
              <RefreshButton 
                onClick={refreshAnalytics}
                disabled={isLoading}
                $isLoading={isLoading}
              >
                <RefreshIcon 
                  xmlns="http://www.w3.org/2000/svg" 
                  $isSpinning={isLoading}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </RefreshIcon>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </RefreshButton>
            )}
          </Header>
          
          {errorMessage && (
            <AlertContainer $type={isAuthError ? 'auth' : 'error'} role="alert">
              <AlertTitle>{isAuthError ? 'Authentication Error' : 'Error'}</AlertTitle>
              <AlertText>{errorMessage}</AlertText>
              {isAuthError && (
                <SignInButton onClick={handleRetryAuth}>
                  Sign in again
                </SignInButton>
              )}
            </AlertContainer>
          )}
          
          {!hasUser ? (
            <AlertContainer $type="warning" role="alert">
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertText>Please sign in to view analytics.</AlertText>
            </AlertContainer>
          ) : !selectedWorkspace && !workspacesLoading ? (
            <WorkspaceSelectAlert role="alert">
              <WorkspaceAlertTitle>No Workspace Selected</WorkspaceAlertTitle>
              <WorkspaceAlertText>Please select a workspace from the sidebar to view your analytics.</WorkspaceAlertText>
              {workspaces.length === 0 ? (
                <WorkspaceAlertSmallText>You don't have any workspaces yet. Create one to get started.</WorkspaceAlertSmallText>
              ) : (
                <DashboardButton onClick={handleGoToDashboard}>
                  Go to Dashboard
                </DashboardButton>
              )}
            </WorkspaceSelectAlert>
          ) : isLoadingData && isInitialLoad ? (
            <AnalyticsLoading />
          ) : analytics ? (
            <AnalyticsContainer>
              <PerformanceOverview 
                analytics={analytics as UserPerformanceAnalytics} 
                isLoading={isLoading && !isInitialLoad}
                getSubjectName={getSubjectName}
              />
              
              <PerformanceCharts 
                analytics={analytics}
                getSubjectName={getSubjectName}
              />
            </AnalyticsContainer>
          ) : selectedWorkspace ? (
            <NoDataContainer>
              <NoDataTitle>No Analytics Data</NoDataTitle>
              <NoDataText>
                No analytics data is available for this workspace yet. Complete some quizzes to see your performance analytics.
              </NoDataText>
              <NoDataHint>
                Try taking quizzes on different subjects to track your progress and see detailed analytics here.
              </NoDataHint>
            </NoDataContainer>
          ) : null}
        </Container>
      </AuthGuard>
    </AnalyticsLayout>
  );
} 