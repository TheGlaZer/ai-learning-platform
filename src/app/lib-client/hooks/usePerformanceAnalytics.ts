import { useState, useEffect } from 'react';
import axiosInstance from '@/app/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { PerformanceAnalytics } from '@/app/models/performanceAnalytics';

interface PerformanceAnalyticsConfig {
  autoFetch?: boolean;
  onError?: (error: Error) => void;
}

export function usePerformanceAnalytics(
  userId: string,
  workspaceId: string,
  config?: PerformanceAnalyticsConfig
) {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { accessToken } = useAuth();
  
  // Extract config options with defaults
  const autoFetch = config?.autoFetch !== false; // Default to true if not specified

  // Function to fetch analytics that can be called externally
  const fetchAnalytics = async (userIdParam?: string, workspaceIdParam?: string) => {
    const effectiveUserId = userIdParam || userId;
    const effectiveWorkspaceId = workspaceIdParam || workspaceId;
    
    console.log('Fetching analytics with params:', { 
      effectiveUserId, 
      effectiveWorkspaceId, 
      hasAccessToken: !!accessToken 
    });
    
    if (!effectiveUserId || !accessToken || !effectiveWorkspaceId) {
      const err = new Error('User must be authenticated and workspace must be selected to fetch analytics');
      console.error('Analytics fetch error:', err.message);
      setError(err);
      if (config?.onError) config.onError(err);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Making API request to /api/analytics');
      const response = await axiosInstance.get(`/api/analytics`, {
        params: {
          userId: effectiveUserId,
          workspaceId: effectiveWorkspaceId
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('Analytics API response:', response.status, response.data);
      setAnalytics(response.data);
      return response.data;
    } catch (err: any) {
      let errorMessage = 'Failed to fetch performance analytics';
      
      console.error('Analytics API error:', { 
        status: err.response?.status, 
        error: err.response?.data?.error,
        message: err.message
      });
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication error: Please log in again to view analytics';
      }
      
      const error = new Error(errorMessage);
      setError(error);
      if (config?.onError) config.onError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch if autoFetch is enabled
  useEffect(() => {
    if (autoFetch && userId && workspaceId) {
      console.log('Auto-fetching analytics for:', { userId, workspaceId });
      fetchAnalytics();
    }
  }, [workspaceId, userId, accessToken, autoFetch]);

  return {
    analytics,
    loading,
    isLoading: loading, // For compatibility with other hooks
    error,
    fetchAnalytics
  };
} 