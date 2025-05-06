import { ContentProcessor, ProcessingOptions, ProcessingResult } from './ContentProcessor';
import { FileMetadata } from '@/app/models/file';
import { extractTextFromFile } from '@/app/utils/fileProcessing/index';
import { FileTypeProcessorOptions } from '@/app/utils/fileProcessing/types';
import { TextProcessor, TextProcessingOptions } from './TextProcessor';
import EmbeddingManager from '../vectorEmbedding';

/**
 * File specific processing options
 */
export interface FileProcessingOptions extends ProcessingOptions {
  /**
   * Language of the file content
   */
  language?: string;
  
  /**
   * Whether to extract text from the file
   */
  extractText?: boolean;
  
  /**
   * Whether to add page markers during text extraction
   */
  addPageMarkers?: boolean;
  
  /**
   * Maximum text length to process for embeddings
   */
  maxTextLength?: number;
}

/**
 * Result of file processing operations
 */
export interface FileProcessingResult extends ProcessingResult<FileMetadata> {
  /**
   * Extracted text from the file (if requested)
   */
  extractedText?: string;
}

/**
 * Processor for file content
 * Handles file text extraction and embedding generation
 */
export class FileProcessor implements ContentProcessor<FileMetadata> {
  private textProcessor: TextProcessor;
  
  /**
   * Create a new FileProcessor instance
   */
  constructor() {
    this.textProcessor = new TextProcessor();
  }
  
  /**
   * Process file content
   * @param file File metadata to process
   * @param options Processing options
   * @returns Promise resolving to processing result
   */
  async process(file: FileMetadata, options?: FileProcessingOptions): Promise<FileProcessingResult> {
    // Initialize result
    const result: FileProcessingResult = {
      data: file,
      metadata: {}
    };
    
    let fileText: string | undefined;
    
    // Extract text from file if requested
    if (options?.extractText && file.url) {
      try {
        // Get file content
        const fileContent = await this.getFileContent(file);
        
        // Map file_type to content type if needed
        const contentType = this.getContentType(file);
        
        // Extract text from file content
        fileText = await extractTextFromFile(
          fileContent,
          contentType,
          file.name || 'file',
          {
            language: options.language || 'auto',
            addPageMarkers: options.addPageMarkers
          }
        );
        
        result.extractedText = fileText;
        result.metadata!.textExtracted = true;
      } catch (error) {
        console.error('Error extracting text from file:', error);
        result.metadata!.textExtractionError = (error as Error).message;
      }
    }
    
    // Generate embedding if requested
    if (options?.generateEmbedding) {
      try {
        // If we have extracted text, use that for embedding
        if (fileText) {
          // Process the text with the text processor
          const textOptions: TextProcessingOptions = {
            normalize: true,
            maxLength: options.maxTextLength || 8000,
            embeddingModel: options.embeddingModel
          };
          
          const textResult = await this.textProcessor.process(fileText, textOptions);
          result.embedding = textResult.embedding;
        } else {
          // Otherwise, generate embedding from file metadata
          result.embedding = await this.generateEmbedding(file, options);
        }
        
        result.metadata!.embeddingGenerated = true;
        result.metadata!.embeddingModel = options.embeddingModel || 'default';
      } catch (error) {
        console.error('Error generating embedding for file:', error);
        result.metadata!.embeddingError = (error as Error).message;
      }
    }
    
    return result;
  }
  
  /**
   * Generate embedding for file
   * @param file File to generate embedding for
   * @param options Processing options
   * @returns Promise resolving to embedding vector
   */
  async generateEmbedding(file: FileMetadata, options?: FileProcessingOptions): Promise<number[]> {
    // If text extraction is not enabled, generate embedding from file metadata
    if (!options?.extractText) {
      // Create a text representation of the file metadata
      const metadataText = [
        file.name,
        file.file_type,
        file.user_id,
        file.workspace_id
      ].filter(Boolean).join(' ');
      
      // Generate embedding for the metadata text
      return await this.textProcessor.generateEmbedding(metadataText, {
        normalize: true,
        embeddingModel: options?.embeddingModel
      });
    }
    
    // Otherwise, extract text and generate embedding
    try {
      // Get file content
      const fileContent = await this.getFileContent(file);
      
      // Map file_type to content type if needed
      const contentType = this.getContentType(file);
      
      // Extract text from file
      const fileText = await extractTextFromFile(
        fileContent,
        contentType,
        file.name || 'file',
        {
          language: options.language || 'auto',
          addPageMarkers: options.addPageMarkers
        }
      );
      
      // Generate embedding for extracted text
      return await this.textProcessor.generateEmbedding(fileText, {
        normalize: true,
        maxLength: options.maxTextLength || 8000,
        embeddingModel: options.embeddingModel
      });
    } catch (error) {
      console.error('Error generating embedding for file:', error);
      throw new Error(`Failed to generate embedding for file: ${(error as Error).message}`);
    }
  }
  
  /**
   * Get content type based on file metadata
   * @param file File metadata
   * @returns Content type string
   */
  private getContentType(file: FileMetadata): string {
    // Map file types to MIME types
    const mimeMap: Record<string, string> = {
      'document': 'application/pdf',
      'summary': 'text/plain',
      'quiz': 'application/json'
    };
    
    // Try to get MIME type from file_type
    if (file.file_type && mimeMap[file.file_type]) {
      return mimeMap[file.file_type];
    }
    
    // Fallback to extension-based detection
    const extension = file.name?.split('.').pop()?.toLowerCase();
    if (extension) {
      const extMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'ppt': 'application/vnd.ms-powerpoint',
        'txt': 'text/plain',
        'json': 'application/json',
        'html': 'text/html'
      };
      
      if (extMap[extension]) {
        return extMap[extension];
      }
    }
    
    // Default fallback
    return 'application/octet-stream';
  }
  
  /**
   * Get file content for processing
   * @param file File metadata
   * @returns Promise resolving to file content
   */
  private async getFileContent(file: FileMetadata): Promise<ArrayBuffer> {
    if (!file.url) {
      throw new Error('File URL is required');
    }
    
    try {
      // Download file content
      const response = await fetch(file.url);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download file: ${(error as Error).message}`);
    }
  }
} 