'use client';

import React from 'react';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
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
import { useTranslations } from 'next-intl';
import * as colors from '../../../../colors';

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
  position: relative;
`;

const HeaderContent = styled.div``;

const PageTitle = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: ${colors.text.primary};
`;

const PageDescription = styled.p`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: ${colors.text.secondary};
`;

const WorkspaceInfo = styled.p`
  font-size: 0.875rem;
  color: ${colors.primary.main};
  margin-top: 0.25rem;
  font-weight: 500;
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
  background-color: ${colors.primary.main};
  color: ${colors.text.white};
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${colors.primary.dark};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${colors.primary.transparent};
  }
`;

const RefreshIcon = styled.svg<{ $isSpinning?: boolean }>`
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
  
  ${props => props.$isSpinning && css`
    animation: ${spin} 1.5s linear infinite;
  `}
`;

const AlertContainer = styled.div<{ $type: 'error' | 'warning' | 'auth' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  
  ${props => {
    switch (props.$type) {
      case 'error':
        return css`
          background-color: ${colors.secondary.main}22;
          border: 1px solid ${colors.secondary.main};
        `;
      case 'warning':
        return css`
          background-color: ${colors.accent.yellow.main}22;
          border: 1px solid ${colors.accent.yellow.main};
        `;
      case 'auth':
        return css`
          background-color: ${colors.primary.main}22;
          border: 1px solid ${colors.primary.main};
        `;
      default:
        return '';
    }
  }}
`;

const AlertTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${colors.text.primary};
`;

const AlertText = styled.p`
  font-size: 0.875rem;
  color: ${colors.text.secondary};
`;

const SignInButton = styled.button`
  background-color: ${colors.primary.main};
  color: ${colors.text.white};
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 1rem;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: ${colors.primary.dark};
  }
`;

const WorkspaceSelectAlert = styled.div`
  padding: 2rem;
  background-color: white;
  border-radius: 0.75rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const WorkspaceAlertTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${colors.text.primary};
`;

const WorkspaceAlertText = styled.p`
  color: ${colors.text.secondary};
  margin-bottom: 1.5rem;
`;

const WorkspaceAlertSmallText = styled.p`
  font-size: 0.875rem;
  color: ${colors.text.secondary};
  margin-bottom: 1rem;
`;

const DashboardButton = styled.button`
  background-color: ${colors.primary.main};
  color: ${colors.text.white};
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: ${colors.primary.dark};
  }
`;

const AnalyticsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const NoDataContainer = styled.div`
  padding: 2rem;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  text-align: center;
`;

const NoDataTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${colors.text.primary};
`;

const NoDataText = styled.p`
  color: ${colors.text.secondary};
  margin-bottom: 1.5rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;

const NoDataHint = styled.p`
  font-size: 0.875rem;
  color: ${colors.text.secondary};
  font-style: italic;
`;

export default function AnalyticsPage() {
  const router = useRouter();
  const t = useTranslations('Analytics');
  
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
              <PageTitle>{t('pageTitle')}</PageTitle>
              <PageDescription>
                {t('pageDescription')}
              </PageDescription>
              {selectedWorkspace && (
                <WorkspaceInfo>
                  {t('workspaceInfo', { name: selectedWorkspace.name })}
                </WorkspaceInfo>
              )}
            </HeaderContent>
            
            {hasUser && !isInitialLoad && selectedWorkspace && (
              <RefreshButton 
                onClick={refreshAnalytics}
                disabled={isLoading}
                $isLoading={isLoading}
                aria-label={isLoading ? t('refreshingButton') : t('refreshButton')}
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
                {isLoading ? t('refreshingButton') : t('refreshButton')}
              </RefreshButton>
            )}
          </Header>
          
          {errorMessage && (
            <AlertContainer $type={isAuthError ? 'auth' : 'error'} role="alert">
              <AlertTitle>{isAuthError ? t('authErrorTitle') : t('errorTitle')}</AlertTitle>
              <AlertText>{errorMessage}</AlertText>
              {isAuthError && (
                <SignInButton onClick={handleRetryAuth}>
                  {t('signInButton')}
                </SignInButton>
              )}
            </AlertContainer>
          )}
          
          {!hasUser ? (
            <AlertContainer $type="warning" role="alert">
              <AlertTitle>{t('authErrorTitle')}</AlertTitle>
              <AlertText>{t('authRequired')}</AlertText>
            </AlertContainer>
          ) : !selectedWorkspace && !workspacesLoading ? (
            <WorkspaceSelectAlert role="alert">
              <WorkspaceAlertTitle>{t('noWorkspace')}</WorkspaceAlertTitle>
              <WorkspaceAlertText>{t('selectWorkspacePrompt')}</WorkspaceAlertText>
              {workspaces.length === 0 ? (
                <WorkspaceAlertSmallText>{t('noWorkspacesYet')}</WorkspaceAlertSmallText>
              ) : (
                <DashboardButton onClick={handleGoToDashboard}>
                  {t('dashboardButton')}
                </DashboardButton>
              )}
            </WorkspaceSelectAlert>
          ) : isLoadingData && isInitialLoad ? (
            <AnalyticsLoading />
          ) : analytics ? (
            <AnalyticsContainer>
              <PerformanceOverview 
                analytics={analytics} 
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
              <NoDataTitle>{t('noDataTitle')}</NoDataTitle>
              <NoDataText>
                {t('noDataText')}
              </NoDataText>
              <NoDataHint>
                {t('noDataHint')}
              </NoDataHint>
            </NoDataContainer>
          ) : null}
        </Container>
      </AuthGuard>
    </AnalyticsLayout>
  );
} 