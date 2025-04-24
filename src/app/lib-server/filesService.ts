// This file contains server-only functionality for file operations
// IMPORTANT: Do not import this in client components, use API routes instead
import { supabase, getAuthenticatedClient } from "./supabaseClient";
import { FileMetadata } from "@/app/models/file";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { detectLanguage } from "@/app/utils/fileProcessing/textProcessing";
import { extractTextFromFile } from "@/app/utils/fileProcessing/index";

// Define the database schema types
interface Database {
  public: {
    Tables: {
      files: {
        Row: FileMetadata;
        Insert: Omit<FileMetadata, 'id' | 'created_at'>;
      };
    };
  };
}

export const uploadFile = async (
  userId: string,
  workspaceName: string,
  file: File,
  token: string
): Promise<FileMetadata> => {
  // Get authenticated client
  const client = await getAuthenticatedClient(token);

  // Get the original file name and extension
  const fileNameParts = file.name.split('.');
  const fileExtension = fileNameParts.pop() || '';
  const baseFileName = fileNameParts.join('.');

  // First sanitize by replacing spaces with underscores
  const sanitizedFileName = baseFileName
    .replace(/\s+/g, '_');    // Replace spaces with underscores

  // Then encode to handle Hebrew and other non-ASCII characters
  // Generate a base64 encoding to make it safe for storage paths
  const encodedFileName = Buffer.from(sanitizedFileName).toString('base64')
    .replace(/\+/g, '-')  // Replace + with - (URL-safe base64)
    .replace(/\//g, '_')  // Replace / with _ (URL-safe base64)
    .replace(/=/g, '');   // Remove padding = characters

  // Use the encoded file name for storage path
  const safeFileName = `${encodedFileName}.${fileExtension}`;

  // Keep storing the original sanitized name for display purposes
  const displayName = `${sanitizedFileName}.${fileExtension}`;

  // Create a safe workspace id
  const safeWorkspaceName = workspaceName
    .replace(/[^\w-]/g, '_'); // Replace any non-alphanumeric or hyphen char
  
  // Use userId for organization
  const safeUserId = userId
    .replace(/[^\w-]/g, '_'); // Replace any non-alphanumeric or hyphen char
  
  // Path format: private/userId/workspaceId/encodedFileName.ext
  const filePath = `private/${safeUserId}/${safeWorkspaceName}/${safeFileName}`;
  
  // Check if the bucket exists and create it if it doesn't
  try {
    // First check if bucket exists
    const { data: buckets, error: getBucketError } = await client.storage.listBuckets();
    
    const bucketExists = buckets?.some(bucket => bucket.name === "files");
    
    if (!bucketExists) {
      console.log("Bucket 'files' doesn't exist, attempting to create it");
      // Create the bucket with public access
      const { error: createBucketError } = await client.storage.createBucket("files", {
        public: true,
        allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        fileSizeLimit: 52428800, // 50MB limit
      });
      
      if (createBucketError) {
        console.error("Error creating 'files' bucket:", createBucketError);
        throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
      }
    }
  } catch (bucketError) {
    console.error("Error checking/creating storage bucket:", bucketError);
    // Continue with the upload attempt even if bucket check fails
  }
  
  // Upload file to Supabase Storage using authenticated client
  const { data: uploadData, error: uploadError } = await client.storage
    .from("files")
    .upload(filePath, file);
  
  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    
    // Provide a more helpful error message based on the error type
    if (uploadError.message.includes("bucket not found") || 
        uploadError.message.includes("404") || 
        (uploadError as any).statusCode === 404) {
      throw new Error(
        "Storage bucket not found. Please make sure the 'files' bucket exists in your Supabase project. " +
        "Go to Supabase Dashboard > Storage and create a bucket named 'files' with public access enabled."
      );
    }
    
    throw uploadError;
  }

  // Get public URL
  const { data: publicUrlData } = client.storage
    .from("files")
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;
  
  // Try to detect language from file content for text-based files
  let detectedLanguage = null;
  try {
    // Get file extension and appropriate MIME type
    const mimeType = file.type || getMimeTypeFromExtension(fileExtension);
    
    // Attempt language detection for common file types
    const supportedTypes = [
      'text/plain', 
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    // We can also check by extension
    const supportedExtensions = ['txt', 'pdf', 'docx', 'doc', 'pptx'];
    
    if (supportedTypes.includes(mimeType) || 
        (fileExtension && supportedExtensions.includes(fileExtension))) {
      
      console.log(`Attempting language detection for file: ${file.name} (${mimeType})`);
      
      // For text files, we can use text() directly
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        const textSample = text.substring(0, 5000);
        detectedLanguage = detectLanguage(textSample);
      } 
      // For other files, use a small chunk for detection to avoid performance issues
      else {
        // Read only a small part of the file (first 100KB)
        const MAX_BYTES_FOR_DETECTION = 102400; // 100KB
        const blob = file.slice(0, MAX_BYTES_FOR_DETECTION);
        const arrayBuffer = await blob.arrayBuffer();
        
        try {
          // Extract text from the small chunk
          const extractedText = await extractTextFromFile(
            arrayBuffer,
            mimeType,
            file.name,
            { 
              language: 'auto',
              addPageMarkers: false // Don't need page markers for language detection
            }
          );
          
          // Use first 5000 chars for language detection
          const textSample = extractedText.substring(0, 5000);
          detectedLanguage = detectLanguage(textSample);
        } catch (extractError) {
          console.warn(`Failed to extract text for language detection: ${extractError}`);
        }
      }
      
      console.log(`Detected language during file upload: ${detectedLanguage}`);
    }
  } catch (err) {
    // If language detection fails, don't block the upload
    console.warn("Failed to detect language during upload:", err);
  }

  // Insert file metadata into database
  const { data: fileData, error: fileError } = await client
    .from("files")
    .insert({
      workspace_id: workspaceName,
      user_id: userId,
      name: file.name,
      file_type: "document",
      url: publicUrl,
      metadata: {
        detectedLanguage: detectedLanguage,
        displayName: displayName,
        encodedName: safeFileName
      },
    })
    .select()
    .single();

  if (fileError) {
    console.error("Error inserting file metadata:", fileError);
    throw fileError;
  } 
  
  if (!fileData) {
    throw new Error("No file data returned after insert");
  }
  
  return fileData;
};

/**
 * Updates the metadata of a file
 */
export const updateFileMetadata = async (fileId: string, updates: any, token?: string): Promise<boolean> => {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    
    await client
      .from('files')
      .update(updates)
      .eq('id', fileId);
    
    return true;
  } catch (error) {
    console.error('Error updating file metadata:', error);
    return false;
  }
};

/**
 * Extracts a file path from a Supabase Storage URL
 */
function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // The path usually follows the pattern /storage/v1/object/public/files/private/user_id/workspace_id/filename
    // We need to extract the part after "files/"
    const pathParts = urlObj.pathname.split('/');
    const filesIndex = pathParts.findIndex(part => part === 'files');
    
    if (filesIndex !== -1 && filesIndex < pathParts.length - 1) {
      return pathParts.slice(filesIndex + 1).join('/');
    }
    return null;
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
    return null;
  }
}

/**
 * Deletes a file from Supabase Storage
 */
export const deleteFileFromStorage = async (filePathOrUrl: string, token?: string): Promise<boolean> => {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    let filePath = filePathOrUrl;
    
    // Check if this is a URL rather than a storage path
    if (filePathOrUrl.startsWith('http')) {
      const extractedPath = extractFilePathFromUrl(filePathOrUrl);
      if (!extractedPath) {
        console.error('Could not extract file path from URL:', filePathOrUrl);
        return false;
      }
      filePath = extractedPath;
    }
    
    console.log(`Deleting file from storage: ${filePath}`);
    
    const { error } = await client.storage
      .from('files')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting file from storage:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    return false;
  }
};

/**
 * Deletes a file from the database and storage
 */
export const deleteFile = async (fileId: string, token?: string): Promise<boolean> => {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    
    // First, get the file data to get the URL for storage deletion
    const { data: file, error: getError } = await client
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (getError) {
      console.error('Error getting file data for deletion:', getError);
      return false;
    }
    
    // Delete from storage if URL exists
    if (file?.url) {
      await deleteFileFromStorage(file.url, token);
    }
    
    // Delete the file record from the database
    const { error } = await client
      .from('files')
      .delete()
      .eq('id', fileId);
    
    if (error) {
      console.error('Error deleting file from database:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Gets all files for a specific workspace.
 * 
 * @param workspaceId - The ID of the workspace to fetch files for
 * @param token - Optional auth token for authenticated requests
 * @returns An array of file metadata objects
 */
export const getFilesByWorkspace = async (workspaceId: string, token?: string): Promise<FileMetadata[]> => {
  const client = token ? await getAuthenticatedClient(token) : supabase;
  
  const { data, error } = await client
    .from("files")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching files:", error);
    throw error;
  }

  return data || [];
};

/**
 * Helper function to get MIME type from file extension
 */
function getMimeTypeFromExtension(extension?: string): string {
  if (!extension) return 'application/octet-stream';
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'json': 'application/json'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

export const getFileDownloadUrl = async (
  fileUrl: string, 
  token?: string,
  fileName?: string
): Promise<string> => {
  try {
    console.log(`[getFileDownloadUrl] Starting with fileUrl: ${fileUrl}, fileName: ${fileName || 'not provided'}`);
    
    const client = token ? await getAuthenticatedClient(token) : supabase;
    console.log(`[getFileDownloadUrl] Using ${token ? 'authenticated' : 'anonymous'} client`);
    
    // Extract the file path from the URL
    const filePath = extractFilePathFromUrl(fileUrl);
    console.log(`[getFileDownloadUrl] Extracted filePath: ${filePath || 'failed to extract'}`);
    
    if (!filePath) {
      throw new Error(`Invalid file URL format: ${fileUrl}`);
    }
    
    // If no fileName was provided, try to extract one from the file path
    if (!fileName) {
      try {
        console.log('[getFileDownloadUrl] No fileName provided, attempting to find one');
        
        // Try to get the file name from the database
        const { data: files } = await client
          .from("files")
          .select("name")
          .eq("url", fileUrl)
          .limit(1);
          
        if (files && files.length > 0) {
          fileName = files[0].name;
          console.log(`[getFileDownloadUrl] Found fileName from database: ${fileName}`);
        } else {
          // Fallback to using the path's filename
          const pathParts = filePath.split('/');
          fileName = pathParts[pathParts.length - 1];
          console.log(`[getFileDownloadUrl] Using filename from path: ${fileName}`);
        }
      } catch (err) {
        console.warn("Could not determine fileName:", err);
      }
    }
    
    // Set download options with content-disposition
    const options = { 
      download: true 
    } as {download: boolean | string};
    
    // If we have a fileName, set the content-disposition header
    if (fileName) {
     options.download = fileName
    }
    
    console.log(`[getFileDownloadUrl] Creating signed URL for path: ${filePath} with options:`, options);
    
    // Create a signed URL with 60 seconds expiry
    const { data, error } = await client.storage
      .from('files')
      .createSignedUrl(filePath, 60, options);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }
    
    console.log(`[getFileDownloadUrl] Successfully created signed URL. Preview: ${data.signedUrl.substring(0, 100)}...`);
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting file download URL:', error);
    throw error;
  }
};

/**
 * Gets file size and type information for a specific file by ID.
 * This is useful for validation before processing files.
 */
export const getFileSizeFromId = async (fileId: string, token?: string): Promise<{ size: number; type: string } | null> => {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    
    // Get file metadata from database
    const { data: file, error } = await client
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (error || !file) {
      console.error('Error getting file:', error);
      return null;
    }
    
    // Extract size and MIME type from metadata
    let fileSize = file.metadata?.size;
    let fileType = file.metadata?.mimeType;
    
    // If size is not in metadata, we might need to fetch it from storage
    if (!fileSize && file.url) {
      try {
        // Extract file path from URL
        const filePath = extractFilePathFromUrl(file.url);
        
        if (filePath) {
          // Get file information from storage
          const { data: fileData, error: fileError } = await client.storage
            .from('files')
            .download(filePath);
          
          if (!fileError && fileData) {
            fileSize = fileData.size;
          }
        }
      } catch (downloadError) {
        console.warn('Error getting file size from storage:', downloadError);
      }
    }
    
    // If file type is not in metadata, try to determine from file name
    if (!fileType && file.name) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      fileType = getMimeTypeFromExtension(extension);
    }
    
    // Return file size and type info if available
    if (fileSize && fileType) {
      return {
        size: fileSize,
        type: fileType
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in getFileSizeFromId:', error);
    return null;
  }
};
