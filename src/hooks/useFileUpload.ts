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

// Define file size limits per file type (in bytes)
export const FILE_SIZE_LIMITS = {
  // Word documents (approximately 150 pages max)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 50 * 1024 * 1024, // 50MB for DOCX
  'application/msword': 50 * 1024 * 1024, // 50MB for DOC
  
  // PowerPoint presentations
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 50 * 1024 * 1024, // 50MB for PPTX
  'application/vnd.ms-powerpoint': 50 * 1024 * 1024, // 50MB for PPT
  
  // PDF documents
  'application/pdf': 50 * 1024 * 1024, // 50MB for PDF
  
  // Default limit for any other accepted file type
  'default': 50 * 1024 * 1024 // 50MB default
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

// Helper to get the file size limit for a specific file type
export const getFileSizeLimit = (fileType: string): number => {
  return FILE_SIZE_LIMITS[fileType as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS['default'];
};

interface UseFileUploadReturn {
  isUploading: boolean;
  error: string | null;
  uploadedFile: FileMetadata | null;
  uploadProgress: number;
  uploadFile: (workspaceId: string, file: File) => Promise<FileMetadata | null>;
  resetUploadState: () => void;
  validateFileType: (file: File) => boolean;
  validateFileSize: (file: File) => { valid: boolean; message?: string };
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

  const validateFileSize = (file: File): { valid: boolean; message?: string } => {
    const sizeLimit = getFileSizeLimit(file.type);
    
    if (file.size > sizeLimit) {
      const readableLimit = formatFileSize(sizeLimit);
      const readableSize = formatFileSize(file.size);
      return { 
        valid: false, 
        message: `File size (${readableSize}) exceeds the maximum allowed size (${readableLimit}) for this file type.`
      };
    }
    
    return { valid: true };
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
    
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      setError(sizeValidation.message || 'File size exceeds the maximum allowed limit.');
      return null;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(10);

      // Simulate progress updates (since the actual API doesn't provide progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          // Calculate a smaller increment to make it last longer
          const newProgress = prev + 1.8; // This will reach 90% in 5 seconds (90/1.8 = 50 steps, 50 * 100ms = 5 seconds)
          return newProgress < 90 ? newProgress : 90;
        });
      }, 100); // Update every 100ms for smoother progress

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
    validateFileType,
    validateFileSize
  };
};