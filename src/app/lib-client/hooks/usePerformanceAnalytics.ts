import { useState, useEffect } from 'react';
import axiosInstance from '@/app/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { PerformanceAnalytics } from '@/app/models/performanceAnalytics';

export function usePerformanceAnalytics(workspaceId: string) {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { accessToken, userId } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId || !accessToken) {
        setError(new Error('User must be authenticated to fetch analytics'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.get(`/api/performance-analytics/${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        setAnalytics(response.data);
      } catch (err: any) {
        let errorMessage = 'Failed to fetch performance analytics';
        
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        if (err.response?.status === 401) {
          errorMessage = 'Authentication error: Please log in again to view analytics';
        }
        
        setError(new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [workspaceId, userId, accessToken]);

  return {
    analytics,
    loading,
    error
  };
} 