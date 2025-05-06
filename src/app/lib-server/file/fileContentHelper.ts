'use server';

import { FileMetadata } from '@/app/models/file';
import { getAuthenticatedClient, supabase } from '../supabaseClient';
import { extractTextFromFile } from '@/app/utils/fileProcessing/index';
import { detectLanguage } from '@/app/utils/fileProcessing/textProcessing';

/**
 * Helper function to get MIME type from file extension
 */
export async function getMimeTypeFromExtension(extension?: string): Promise<string> {
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

/**
 * Extract file path from URL for past exams and other files
 */
export async function extractFilePathFromUrl(url?: string): Promise<string | null> {
  if (!url) return null;
  
  const urlMatch = url.match(/\/files\/([^?]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return null;
}

/**
 * Get file content with truncation for very large files to prevent token limit errors
 */
export const getFileContent = async (
  fileId: string,
  token?: string
): Promise<{ file: FileMetadata; content: string }> => {
  try {
    // Use authenticated client if token provided
    const client = token ? await getAuthenticatedClient(token) : supabase;

    // Query the file metadata
    const { data: file, error: fileError } = await client
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      console.error("Error fetching file:", fileError);
      throw new Error(`File not found: ${fileId}`);
    }

    console.log(`Found file metadata:`, {
      id: file.id,
      name: file.name,
      workspaceId: file.workspace_id,
      url: file.url
    });
    
    // Determine the file path for download
    let filePath = `${file.workspace_id}/${file.name}`;
    
    // Check if the URL contains a different path pattern
    if (file.url) {
      const extractedPath = await extractFilePathFromUrl(file.url);
      if (extractedPath) {
        filePath = extractedPath;
        console.log(`Using path from URL: ${filePath}`);
      }
    }
    
    console.log(`Attempting to download file from storage path: ${filePath}`);

    // Get the file from storage
    let fileData;
    let storageError;
    
    // First attempt with the primary path
    const primaryDownloadResult = await client.storage
      .from("files")
      .download(filePath);
      
    fileData = primaryDownloadResult.data;
    storageError = primaryDownloadResult.error;

    if (storageError || !fileData) {
      console.error("Error downloading file:", storageError);
      
      // Try an alternative path if the first one fails
      console.log(`First download attempt failed, trying alternative path structure...`);
      
      // Try with public/ prefix
      const altPath = `public/${file.workspace_id}/${file.name}`;
      console.log(`Attempting with alternative path: ${altPath}`);
      
      const altDownloadResult = await client.storage
        .from("files")
        .download(altPath);
        
      fileData = altDownloadResult.data;
      const altError = altDownloadResult.error;
        
      if (altError || !fileData) {
        console.error("Alternative download also failed:", altError);
        throw new Error(`Could not download file: ${file.name}. Please check file permissions and path.`);
      }
      
      console.log(`Alternative download successful!`);
    }

    // Get file extension and MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = await getMimeTypeFromExtension(fileExtension);
    console.log(`Processing file with extension: ${fileExtension}, MIME type: ${mimeType}`);

    // Extract text content
    const arrayBuffer = await fileData.arrayBuffer();
    console.log(`File loaded as ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);
    
    let content = await extractTextFromFile(
      arrayBuffer,
      mimeType,
      file.name,
      { 
        language: 'auto',
        addPageMarkers: true // Add page markers for better context in quiz generation
      }
    );
    
    console.log(`Text extraction complete, extracted ${content.length} characters`);
    
    // Check and truncate content if it's too large
    // An average GPT-4o prompt can handle about 100k characters safely
    const MAX_SAFE_CHARS = 100000;
    if (content.length > MAX_SAFE_CHARS) {
      console.warn(`File content is very large (${content.length} chars). Truncating to ${MAX_SAFE_CHARS} chars to prevent token limit errors.`);
      content = content.substring(0, MAX_SAFE_CHARS);
      content += "\n\n[Content truncated due to length...]";
    }
    
    // Get the detected language from file metadata or detect it from content
    let detectedLanguage = file.metadata?.detectedLanguage;
    
    // If language isn't in metadata, detect it from content
    if (!detectedLanguage) {
      detectedLanguage = detectLanguage(content);
      console.log(`Language not found in metadata, detected from content: ${detectedLanguage}`);
      
      // Update the file metadata with the detected language for future use
      try {
        await client
          .from("files")
          .update({
            metadata: {
              ...file.metadata,
              detectedLanguage,
            },
          })
          .eq("id", fileId);
        
        console.log(`Updated file metadata with detected language: ${detectedLanguage}`);
      } catch (updateError) {
        console.warn(`Failed to update file metadata with language: ${updateError}`);
        // Continue execution even if metadata update fails
      }
    } else {
      console.log(`Using language from file metadata: ${detectedLanguage}`);
    }

    return { file, content };
  } catch (error) {
    console.error("Error in getFileContent:", error);
    throw error;
  }
}; 