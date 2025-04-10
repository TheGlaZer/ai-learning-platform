import { fileTypeProcessors } from './fileTypeProcessors';
import { FileTypeProcessorOptions } from './types';
import { detectLanguage } from './textProcessing';

/**
 * Extract text content from a file
 * @param fileBuffer The file buffer to extract content from
 * @param mimeType The MIME type of the file
 * @param fileName The name of the file (for extension-based fallback)
 * @param options Additional options for processing
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromFile(
  fileBuffer: ArrayBuffer, 
  mimeType: string, 
  fileName: string,
  options: FileTypeProcessorOptions = {}
): Promise<string> {
  try {
    console.log(`=== Starting text extraction for ${fileName} (${mimeType}) ===`);
    console.log(`File buffer size: ${fileBuffer.byteLength} bytes`);
    
    if (!fileBuffer || fileBuffer.byteLength === 0) {
      throw new Error(`Empty file buffer provided for ${fileName}`);
    }
    
    // Get the appropriate processor based on the MIME type
    let processor = fileTypeProcessors[mimeType];
    let actualMimeType = mimeType;
    
    // If no processor found for MIME type, try to determine from file extension
    if (!processor) {
      console.log(`No processor found for MIME type: ${mimeType}, trying to determine from file extension`);
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      
      // Map common extensions to MIME types
      const mimeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'ppt': 'application/vnd.ms-powerpoint',
        'txt': 'text/plain',
        'html': 'text/html',
        'htm': 'text/html',
      };
      
      if (fileExtension && mimeMap[fileExtension]) {
        const extensionBasedMime = mimeMap[fileExtension];
        console.log(`Found extension ${fileExtension}, mapped to MIME type ${extensionBasedMime}`);
        processor = fileTypeProcessors[extensionBasedMime];
        
        if (processor) {
          actualMimeType = extensionBasedMime;
          console.log(`Using processor for MIME type: ${actualMimeType}`);
        }
      }
    }
    
    if (!processor) {
      // For unknown file types, try basic text extraction as a fallback
      console.warn(`No processor available for ${mimeType} - ${fileName}, trying generic text extraction`);
      
      try {
        // Try to read as text
        const text = new TextDecoder().decode(fileBuffer);
        
        if (text && text.trim().length > 0 && !isBinaryString(text.substring(0, 1000))) {
          console.log(`Successfully extracted text using generic text decoder: ${text.length} characters`);
          return text;
        } else {
          throw new Error(`Could not extract text from unsupported file type: ${mimeType}`);
        }
      } catch (textError) {
        throw new Error(`Unsupported file type: ${mimeType} for file ${fileName}`);
      }
    }
    
    console.log(`Processing file: ${fileName} (${actualMimeType})`);
    
    // Process the file
    const extractedText = await processor(fileBuffer, options);
    
    // Auto-detect language if not specified
    if (!options.language) {
      const detectedLanguage = detectLanguage(extractedText);
      console.log(`Detected language: ${detectedLanguage}`);
    }
    
    console.log(`=== Text extraction complete, extracted ${extractedText.length} characters ===`);
    
    return extractedText;
  } catch (error) {
    console.error(`Error processing file (${mimeType}):`, error);
    // For debugging
    if (error instanceof Error) {
      console.error(`Error stack: ${error.stack}`);
    }
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to check if a string appears to be binary data
 */
function isBinaryString(str: string): boolean {
  // Check for common binary characters or patterns
  const nonPrintableChars = str.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g);
  return nonPrintableChars !== null && nonPrintableChars.length > str.length * 0.1;
}

export * from './types';
export * from './textProcessing'; 