"use client";
import { useState } from 'react';
import { uploadFileClient } from '@/app/lib-client/fileClient';
import { FileMetadata } from '@/app/models/file';
import { useAuth } from '@/contexts/AuthContext';

// Define allowed file types
export const ALLOWED_FILE_TYPES = [
  'application/pdf',                                                   // PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/msword',                                               // DOC
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'application/vnd.ms-powerpoint',                                    // PPT
];

// File type extensions for display and validation
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];

interface UseFileUploadReturn {
  isUploading: boolean;
  error: string | null;
  uploadedFile: FileMetadata | null;
  uploadProgress: number;
  uploadFile: (workspaceId: string, file: File) => Promise<FileMetadata | null>;
  resetUploadState: () => void;
  validateFileType: (file: File) => boolean;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const { userId, accessToken } = useAuth();

  const validateFileType = (file: File): boolean => {
    return ALLOWED_FILE_TYPES.includes(file.type);
  };

  const resetUploadState = () => {
    setIsUploading(false);
    setError(null);
    setUploadedFile(null);
    setUploadProgress(0);
  };

  const uploadFile = async (workspaceId: string, file: File): Promise<FileMetadata | null> => {
    if (!userId || !accessToken) {
      setError('You must be logged in to upload files');
      return null;
    }

    if (!validateFileType(file)) {
      setError(`Invalid file type. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
      return null;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(10);

      // Simulate progress updates (since the actual API doesn't provide progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress < 90 ? newProgress : 90;
        });
      }, 300);

      const result = await uploadFileClient(userId, workspaceId, file, accessToken);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadedFile(result);
      
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    error,
    uploadedFile,
    uploadProgress,
    uploadFile,
    resetUploadState,
    validateFileType
  };
};