import { useState, useEffect } from 'react';
import { UserPerformanceAnalytics } from '@/app/models/quizAnswer';
import { usePerformanceAnalytics } from './usePerformanceAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

/**
 * Custom hook that provides analytics data and functionality
 * with improved state management
 */
export function useAnalytics() {
  const { userId } = useAuth();
  const { selectedWorkspace } = useWorkspace();
  const workspaceId = selectedWorkspace?.id || '';
  
  // Analytics state
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const MAX_RETRIES = 2;
  const DEBOUNCE_TIME = 10000; // 10 seconds
  
  console.log('useAnalytics - current state:', { 
    userId, 
    workspaceId: selectedWorkspace?.id, 
    workspaceName: selectedWorkspace?.name 
  });
  
  // Use the performance analytics hook
  const { 
    fetchAnalytics, 
    isLoading, 
    error, 
    analytics 
  } = usePerformanceAnalytics(userId || '', workspaceId, { 
    autoFetch: false,
    onError: (err) => {
      console.error('useAnalytics - Error from usePerformanceAnalytics:', err.message);
      setErrorMessage(err.message);
      setIsAuthError(err.message.includes('Authentication required'));
    }
  });
  
  // Convert analytics data to UserPerformanceAnalytics format if needed
  const formattedAnalytics = analytics ? (analytics as unknown as UserPerformanceAnalytics) : null;
  
  // Fetch analytics with debounce and retry logic
  const fetchAnalyticsData = async () => {
    if (!userId || !workspaceId || retryCount >= MAX_RETRIES) {
      console.log('useAnalytics - Skipping fetch due to missing data or max retries:', {
        hasUserId: !!userId,
        hasWorkspaceId: !!workspaceId,
        retryCount,
        MAX_RETRIES
      });
      return;
    }
    
    const now = Date.now();
    if (now - lastFetchTime < DEBOUNCE_TIME) {
      console.log('useAnalytics - Skipping fetch due to debounce');
      return;
    }
    
    setLastFetchTime(now);
    
    try {
      console.log('useAnalytics - Fetching analytics data for:', { userId, workspaceId });
      await fetchAnalytics(userId, workspaceId);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('useAnalytics - Error fetching data:', err);
      setRetryCount(prev => prev + 1);
    }
  };
  
  // Reset state when user or workspace changes
  useEffect(() => {
    console.log('useAnalytics - User or workspace changed, resetting state');
    setRetryCount(0);
    setLastFetchTime(0);
    setIsInitialLoad(true);
  }, [userId, workspaceId]);
  
  // Fetch data when dependencies change
  useEffect(() => {
    if (userId && workspaceId) {
      console.log('useAnalytics - Dependencies changed, fetching data');
      fetchAnalyticsData();
    }
  }, [userId, workspaceId, retryCount]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.log('useAnalytics - Error state updated:', error.message);
      setErrorMessage(error.message);
      setIsAuthError(error.message.includes('Authentication required'));
    } else {
      setErrorMessage(null);
      setIsAuthError(false);
    }
  }, [error]);
  
  // Function to retry authentication
  const handleRetryAuth = () => {
    console.log('useAnalytics - Retrying authentication');
    setErrorMessage(null);
    setIsAuthError(false);
    window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
  };
  
  // Function to manually refresh analytics
  const refreshAnalytics = () => {
    console.log('useAnalytics - Manual refresh triggered');
    setRetryCount(0);
    setLastFetchTime(0);
    fetchAnalyticsData();
  };
  
  return {
    analytics: formattedAnalytics,
    isLoading,
    isInitialLoad,
    errorMessage,
    isAuthError,
    hasWorkspace: !!workspaceId,
    hasUser: !!userId,
    handleRetryAuth,
    refreshAnalytics
  };
} 