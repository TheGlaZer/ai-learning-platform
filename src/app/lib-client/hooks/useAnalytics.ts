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
  
  // Use the performance analytics hook
  const { 
    fetchAnalytics, 
    isLoading, 
    error, 
    analytics 
  } = usePerformanceAnalytics(userId || '', workspaceId, { 
    autoFetch: false,
    onError: (err) => {
      setErrorMessage(err.message);
      setIsAuthError(err.message.includes('Authentication required'));
    }
  });
  
  // Fetch analytics with debounce and retry logic
  const fetchAnalyticsData = async () => {
    if (!userId || !workspaceId || retryCount >= MAX_RETRIES) {
      return;
    }
    
    const now = Date.now();
    if (now - lastFetchTime < DEBOUNCE_TIME) {
      return;
    }
    
    setLastFetchTime(now);
    
    try {
      await fetchAnalytics(userId, workspaceId);
      setIsInitialLoad(false);
    } catch (err) {
      setRetryCount(prev => prev + 1);
    }
  };
  
  // Reset state when user or workspace changes
  useEffect(() => {
    setRetryCount(0);
    setLastFetchTime(0);
    setIsInitialLoad(true);
  }, [userId, workspaceId]);
  
  // Fetch data when dependencies change
  useEffect(() => {
    if (userId && workspaceId) {
      fetchAnalyticsData();
    }
  }, [userId, workspaceId, retryCount]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      setErrorMessage(error.message);
      setIsAuthError(error.message.includes('Authentication required'));
    } else {
      setErrorMessage(null);
      setIsAuthError(false);
    }
  }, [error]);
  
  // Function to retry authentication
  const handleRetryAuth = () => {
    setErrorMessage(null);
    setIsAuthError(false);
    window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
  };
  
  // Function to manually refresh analytics
  const refreshAnalytics = () => {
    setRetryCount(0);
    setLastFetchTime(0);
    fetchAnalyticsData();
  };
  
  return {
    analytics,
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