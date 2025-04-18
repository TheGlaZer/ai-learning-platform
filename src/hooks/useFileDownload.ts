"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFileDownloadUrlClient } from '@/app/lib-client/fileClient';

interface UseFileDownloadReturn {
  downloadFile: (fileUrl: string, fileName: string) => Promise<void>;
  isDownloading: boolean;
  error: string | null;
}

export const useFileDownload = (): UseFileDownloadReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const downloadFile = async (fileUrl: string, fileName: string): Promise<void> => {
    console.log(`[useFileDownload] Starting download process for ${fileName}, URL: ${fileUrl}`);
    
    if (typeof window === 'undefined' || !fileUrl) {
      console.error('[useFileDownload] Invalid file or URL');
      setError('Invalid file or file URL');
      return;
    }
    
    if (!accessToken) {
      console.error('[useFileDownload] No access token available');
      setError('Authentication required to download files');
      return;
    }
    
    setIsDownloading(true);
    setError(null);
    
    try {
      console.log(`[useFileDownload] Requesting signed URL for file: ${fileName}`);
      
      // Get the signed URL from our API
      const signedUrl = await getFileDownloadUrlClient(fileUrl, accessToken, fileName);
      console.log(`[useFileDownload] Received signed URL. Preview: ${signedUrl.substring(0, 100)}...`);
      
      console.log(`[useFileDownload] Creating download link with filename: ${fileName}`);
      
      // Create a hidden anchor and trigger download with correct filename
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = fileName; // This will override the server's content-disposition
      console.log(`[useFileDownload] Download attribute set to: ${link.download}`);
      
      document.body.appendChild(link);
      console.log('[useFileDownload] Link added to document, triggering click');
      link.click();
      
      // Small delay to ensure download starts before removing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      link.remove();
      console.log('[useFileDownload] Download link removed from document');
    } catch (err) {
      console.error('[useFileDownload] Error during download:', err);
      setError('Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
      console.log('[useFileDownload] Download process completed');
    }
  };

  return {
    downloadFile,
    isDownloading,
    error
  };
};

export default useFileDownload; 