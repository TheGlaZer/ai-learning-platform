import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/app/lib/axios';
import { useTranslations } from 'next-intl';

interface EmbeddingStatus {
  fileId: string;
  fileName: string;
  hasEmbeddings: boolean;
  isGenerating: boolean;
  error: string | null;
  count: number;
  generatedAt: string | null;
}

interface UseFileEmbeddingsReturn {
  status: EmbeddingStatus | null;
  isLoading: boolean;
  error: string | null;
  getEmbeddingStatus: (fileId: string) => Promise<EmbeddingStatus | null>;
  generateEmbeddings: (fileId: string) => Promise<boolean>;
  isPolling: boolean;
  startPolling: (fileId: string, intervalMs?: number) => void;
  stopPolling: () => void;
}

/**
 * Custom hook for managing file embeddings
 */
export const useFileEmbeddings = (): UseFileEmbeddingsReturn => {
  const { accessToken } = useAuth();
  const t = useTranslations('FileEmbeddings');
  const [status, setStatus] = useState<EmbeddingStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  /**
   * Get embedding status for a file
   */
  const getEmbeddingStatus = useCallback(async (fileId: string): Promise<EmbeddingStatus | null> => {
    if (!accessToken) {
      setError(t('auth.loginRequired'));
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/api/files/embeddings?fileId=${fileId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      setStatus(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || t('errors.generalError');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, t]);
  
  /**
   * Generate embeddings for a file
   */
  const generateEmbeddings = useCallback(async (fileId: string): Promise<boolean> => {
    if (!accessToken) {
      setError(t('auth.loginRequired'));
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/api/files/embeddings', 
        { fileId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      
      // Start polling for status updates if embeddings are being generated
      if (response.data.status === 'processing') {
        startPolling(fileId);
      }
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || t('errors.generalError');
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, t]);
  
  /**
   * Start polling for embedding status updates
   */
  const startPolling = useCallback((fileId: string, intervalMs: number = 3000) => {
    // Clear any existing polling
    stopPolling();
    
    setIsPolling(true);
    
    // Create a new polling interval
    const interval = setInterval(async () => {
      const status = await getEmbeddingStatus(fileId);
      
      // Stop polling if embeddings are generated or there was an error
      if (status && (!status.isGenerating || status.error)) {
        stopPolling();
      }
    }, intervalMs);
    
    setPollingInterval(interval);
  }, [getEmbeddingStatus]);
  
  /**
   * Stop polling for embedding status updates
   */
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    setIsPolling(false);
  }, [pollingInterval]);
  
  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);
  
  return {
    status,
    isLoading,
    error,
    getEmbeddingStatus,
    generateEmbeddings,
    isPolling,
    startPolling,
    stopPolling
  };
}; 