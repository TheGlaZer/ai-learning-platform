// This file contains server-only functionality for file operations
// IMPORTANT: Do not import this in client components, use API routes instead
import { supabase, getAuthenticatedClient } from "../supabaseClient";
import { FileMetadata } from "@/app/models/file";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { detectLanguage } from "@/app/utils/fileProcessing/textProcessing";
import { extractTextFromFile } from "@/app/utils/fileProcessing/index";
import { FileEmbeddingService } from '../FileEmbeddingService';

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

// Create a FileEmbeddingService instance
const fileEmbeddingService = new FileEmbeddingService();

export const uploadFile = async (
  userId: string,
  workspaceName: string,
  file: File,
  token: string,
  options?: {
    skipDuplicateCheck?: boolean;
    allowDuplicateNames?: boolean;
    similarityThreshold?: number;
  }
): Promise<FileMetadata | { error: string; isDuplicate: boolean; similarFile?: { id: string; name: string; similarity: number } }> => {
  // Get authenticated client
  const client = await getAuthenticatedClient(token);

  // Get the original file name and extension
  const fileNameParts = file.name.split('.');
  const fileExtension = fileNameParts.pop() || '';
  const baseFileName = fileNameParts.join('.');

  // Check if file with same name already exists in workspace
  if (!options?.allowDuplicateNames) {
    console.log(`[DuplicateCheck] Checking if file "${file.name}" already exists in workspace: ${workspaceName}`);
    const nameExists = await checkFileNameExists(workspaceName, file.name, token);
    
    if (nameExists) {
      console.log(`[DuplicateCheck] File with name "${file.name}" already exists in workspace: ${workspaceName}`);
      return { 
        error: `A file with the name "${file.name}" already exists in this workspace.`, 
        isDuplicate: true
      };
    }
  }

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
  
  // Check content similarity if needed
  if (!options?.skipDuplicateCheck) {
    try {
      console.log(`[DuplicateCheck] Checking content similarity for file: ${file.name}`);
      
      // Extract text from file for comparison
      const mimeType = file.type || getMimeTypeFromExtension(fileExtension);
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract text for similarity check
      let fileContent = '';
      try {
        fileContent = await extractTextFromFile(
          arrayBuffer,
          mimeType,
          file.name,
          { language: 'auto' }
        );
      } catch (extractError) {
        console.warn(`[DuplicateCheck] Could not extract text for similarity check: ${extractError}`);
        // Continue with upload if text extraction fails
      }
      
      // Only check similarity if we could extract content
      if (fileContent && fileContent.length > 100) {
        const threshold = options?.similarityThreshold || 0.95; // 95% similarity by default
        const similarityCheck = await checkContentSimilarity(
          workspaceName, 
          fileContent, 
          threshold,
          token
        );
        
        if (similarityCheck.isSimilar && similarityCheck.similarFileId) {
          console.log(`[DuplicateCheck] Found similar file: ${similarityCheck.similarFileName} with similarity: ${similarityCheck.similarity}`);
          
          return {
            error: `This file is very similar (${Math.round((similarityCheck.similarity || 0) * 100)}% match) to an existing file: "${similarityCheck.similarFileName}"`,
            isDuplicate: true,
            similarFile: {
              id: similarityCheck.similarFileId,
              name: similarityCheck.similarFileName || '',
              similarity: similarityCheck.similarity || 0
            }
          };
        }
      }
    } catch (similarityError) {
      console.error(`[DuplicateCheck] Error during content similarity check:`, similarityError);
      // Continue with upload if similarity check fails
    }
  }
  
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
  
  // Generate embeddings for the file in a non-blocking way
  try {
    // Get file extension and appropriate MIME type
    const mimeType = file.type || getMimeTypeFromExtension(fileExtension);
    
    // Check if the file format is supported for embedding
    const supportedTypes = [
      'text/plain', 
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    const supportedExtensions = ['txt', 'pdf', 'docx', 'doc', 'pptx'];
    
    if (supportedTypes.includes(mimeType) || 
        (fileExtension && supportedExtensions.includes(fileExtension))) {
      
      console.log(`Extracting text for embeddings generation from file: ${file.name} (${mimeType})`);
      
      // Read the file content
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract text from file
      const extractedText = await extractTextFromFile(
        arrayBuffer,
        mimeType,
        file.name,
        { 
          language: detectedLanguage || 'auto',
          addPageMarkers: true // Add page markers for better context
        }
      );
      
      if (extractedText && extractedText.length > 50) {
        console.log(`Extracted ${extractedText.length} characters for embedding generation`);
        
        // Generate and store embeddings in the background using the FileEmbeddingService
        // Use Promise without await to avoid blocking the response
        fileEmbeddingService.generateEmbeddingsInBackground(fileData, extractedText, token);
      }
    }
  } catch (embeddingError) {
    // Log error but don't fail the upload
    console.error('Error preparing for embedding generation:', embeddingError);
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
    
    // Delete all embeddings associated with this file
    console.log(`[FileService] Deleting embeddings for file: ${fileId}`);
    const { error: embeddingError } = await client
      .from('file_embeddings')
      .delete()
      .eq('file_id', fileId);
    
    if (embeddingError) {
      console.error('Error deleting file embeddings:', embeddingError);
      // Continue with file deletion even if embedding deletion fails
    } else {
      console.log(`[FileService] Successfully deleted embeddings for file: ${fileId}`);
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

/**
 * Check if a file with the same name already exists in a workspace
 */
async function checkFileNameExists(workspaceId: string, fileName: string, token?: string): Promise<boolean> {
  try {
    const client = token ? await getAuthenticatedClient(token) : supabase;
    
    const { data, error } = await client
      .from('files')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('name', fileName)
      .limit(1);
    
    if (error) {
      console.error(`Error checking for duplicate filename: ${error.message}`);
      return false; // Return false on error to allow upload to proceed
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error(`Exception checking for duplicate filename: ${error}`);
    return false; // Return false on error to allow upload to proceed
  }
}

/**
 * Calculate content similarity between two text contents
 * This is a simple implementation that compares character sequences
 * @returns Similarity score between 0 and 1
 */
function calculateContentSimilarity(content1: string, content2: string): number {
  // Normalize text
  const normalize = (text: string): string => {
    return text.toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const normalizedContent1 = normalize(content1);
  const normalizedContent2 = normalize(content2);
  
  // For very short texts, use a different approach
  if (normalizedContent1.length < 100 || normalizedContent2.length < 100) {
    // Count matching characters in sequence
    let matchingChars = 0;
    const minLength = Math.min(normalizedContent1.length, normalizedContent2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (normalizedContent1[i] === normalizedContent2[i]) {
        matchingChars++;
      }
    }
    
    return matchingChars / minLength;
  }
  
  // For longer texts, compare chunks
  const chunkSize = 100;
  const samplingRate = 0.1; // Use 10% of possible chunks
  
  const chunks1 = new Set();
  const chunks2 = new Set();
  
  // Extract chunks from content1
  for (let i = 0; i < normalizedContent1.length - chunkSize; i += Math.floor(chunkSize / samplingRate)) {
    chunks1.add(normalizedContent1.substring(i, i + chunkSize));
  }
  
  // Extract chunks from content2
  for (let i = 0; i < normalizedContent2.length - chunkSize; i += Math.floor(chunkSize / samplingRate)) {
    chunks2.add(normalizedContent2.substring(i, i + chunkSize));
  }
  
  // Count matching chunks
  let matchingChunks = 0;
  chunks1.forEach(chunk => {
    if (chunks2.has(chunk)) {
      matchingChunks++;
    }
  });
  
  // Calculate Jaccard similarity
  const totalUniqueChunks = chunks1.size + chunks2.size - matchingChunks;
  return matchingChunks / totalUniqueChunks;
}

/**
 * Check if file content is similar to any existing file in the workspace
 */
async function checkContentSimilarity(
  workspaceId: string, 
  fileContent: string, 
  similarityThreshold: number = 0.95,
  token?: string
): Promise<{ isSimilar: boolean; similarFileId?: string; similarFileName?: string; similarity?: number }> {
  try {
    // Get authenticated client if token is provided
    const client = token ? await getAuthenticatedClient(token) : supabase;
    
    // Get all files in the workspace
    const { data: files, error } = await client
      .from('files')
      .select('id, name, url')
      .eq('workspace_id', workspaceId);
    
    if (error || !files || files.length === 0) {
      return { isSimilar: false };
    }
    
    console.log(`[DuplicateCheck] Checking content similarity against ${files.length} files in workspace: ${workspaceId}`);
    
    // For each file, download and check similarity
    for (const file of files) {
      try {
        // Extract file path from the URL
        const filePath = extractFilePathFromUrl(file.url);
        if (!filePath) continue;
        
        // Download the file
        const { data: fileData, error: downloadError } = await client.storage
          .from("files")
          .download(filePath);
          
        if (downloadError || !fileData) continue;
        
        // Get file extension and MIME type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const mimeType = getMimeTypeFromExtension(fileExtension);
        
        // Extract text from the file
        const arrayBuffer = await fileData.arrayBuffer();
        const extractedText = await extractTextFromFile(
          arrayBuffer,
          mimeType,
          file.name,
          { language: 'auto' }
        );
        
        // Calculate similarity score
        const similarity = calculateContentSimilarity(fileContent, extractedText);
        
        console.log(`[DuplicateCheck] Similarity with file ${file.name}: ${(similarity * 100).toFixed(2)}%`);
        
        // If similarity is above threshold, return true
        if (similarity >= similarityThreshold) {
          return { 
            isSimilar: true, 
            similarFileId: file.id, 
            similarFileName: file.name,
            similarity
          };
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.name} for similarity check:`, fileError);
        continue;
      }
    }
    
    // No similar file found
    return { isSimilar: false };
  } catch (error) {
    console.error('Error checking content similarity:', error);
    return { isSimilar: false };
  }
}
