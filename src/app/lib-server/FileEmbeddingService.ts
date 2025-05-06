import { supabase, getAuthenticatedClient } from './supabaseClient';
import { extractTextFromFile } from '@/app/utils/fileProcessing/index';
import EmbeddingManager from './vectorEmbedding';
import { SupabaseClient } from '@supabase/supabase-js';
import { PostgresVectorSearch } from './vectorSearch/PostgresVectorSearch';
import { FileMetadata } from '@/app/models/file';
import { textProcessor } from './contentProcessing';

/**
 * Chunk type for storing file content in embeddings
 */
export interface FileChunk {
  content: string;
  startChar: number;
  endChar: number;
  pageNumber?: number;
  title?: string;
}

/**
 * Options for file embedding generation
 */
export interface FileEmbeddingOptions {
  /**
   * Size of chunks to split text into (default: 1000)
   */
  chunkSize?: number;
  
  /**
   * Overlap between chunks (default: 200)
   */
  chunkOverlap?: number;
  
  /**
   * Maximum number of chunks to process (default: 100)
   */
  maxChunks?: number;
  
  /**
   * Whether to normalize text before embedding
   */
  normalize?: boolean;
  
  /**
   * Custom embedding model to use
   */
  embeddingModel?: string;
}

/**
 * Service for handling file embeddings
 */
export class FileEmbeddingService {
  private embeddingManager = EmbeddingManager;
  private vectorSearch: PostgresVectorSearch;
  
  /**
   * Create a new FileEmbeddingService
   * @param supabaseClient Optional Supabase client (defaults to shared instance)
   */
  constructor(supabaseClient?: SupabaseClient) {
    this.vectorSearch = new PostgresVectorSearch(supabaseClient || supabase);
  }
  
  /**
   * Generate embeddings for a file and store them in the database
   * @param file File metadata
   * @param fileContent Extracted text content from the file
   * @param options Options for embedding generation
   * @returns Promise resolving to array of created embedding IDs
   */
  async generateAndStoreFileEmbeddings(
    file: FileMetadata,
    fileContent: string,
    options?: FileEmbeddingOptions,
    token?: string
  ): Promise<string[]> {
    try {
      console.log(`[FileEmbeddingService] Starting embedding generation for file: ${file.id}, name: ${file.name}`);
      console.log(`[FileEmbeddingService] Content length: ${fileContent.length} chars`);
      console.log(`[FileEmbeddingService] Content language: ${file.metadata?.detectedLanguage || 'unknown'}`);
      console.log(`[FileEmbeddingService] Options:`, options);

      // Detect if content contains non-Latin scripts (like Hebrew, Arabic, etc.)
      const hasNonLatinScripts = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/.test(fileContent);
      console.log(`[FileEmbeddingService] Content contains non-Latin scripts: ${hasNonLatinScripts}`);
      
      // Get authenticated client if token is provided
      const client = token ? await getAuthenticatedClient(token) : supabase;
      console.log(`[FileEmbeddingService] Using ${token ? 'authenticated' : 'default'} Supabase client`);
      
      // Get and verify page markers
      const pageMarkers = fileContent.match(/==== Page \d+ ====/g);
      console.log(`[FileEmbeddingService] Detected ${pageMarkers?.length || 0} page markers in content`);
      
      // Split the content into chunks
      console.log(`[FileEmbeddingService] Splitting content with chunkSize: ${options?.chunkSize || 1800}, overlap: ${options?.chunkOverlap || 300}`);
      const chunks = this.splitIntoChunks(fileContent, {
        chunkSize: options?.chunkSize || 1800,
        chunkOverlap: options?.chunkOverlap || 300,
        maxChunks: options?.maxChunks || 100
      });
      
      console.log(`[FileEmbeddingService] Split file content into ${chunks.length} chunks for embedding generation`);
      
      // Check for any unusually short chunks
      const shortChunks = chunks.filter(chunk => chunk.content.length < 50).length;
      if (shortChunks > 0) {
        console.log(`[FileEmbeddingService] Warning: ${shortChunks} chunks are unusually short (< 50 chars)`);
      }
      
      // Check if page numbers appear correct
      const uniquePages = new Set(chunks.map(chunk => chunk.pageNumber)).size;
      console.log(`[FileEmbeddingService] Chunks span ${uniquePages} unique page numbers`);
      
      // Process text if normalization is required
      let processedChunks = chunks;
      if (options?.normalize && !hasNonLatinScripts) {
        // Only normalize Latin scripts to avoid corrupting non-Latin text
        console.log(`[FileEmbeddingService] Normalizing text for Latin script chunks`);
        const processed = await Promise.all(
          chunks.map(chunk => textProcessor.process(chunk.content, { normalize: true }))
        );
        processedChunks = chunks.map((chunk, i) => ({
          ...chunk,
          content: processed[i].data
        }));
      } else if (hasNonLatinScripts) {
        console.log(`[FileEmbeddingService] Skipping normalization for non-Latin text to preserve encoding`);
      }
      
      // Verify content for the first few chunks
      for (let i = 0; i < Math.min(3, processedChunks.length); i++) {
        const originalChunk = chunks[i];
        const processedChunk = processedChunks[i];
        console.log(`[FileEmbeddingService] Chunk ${i}:`);
        console.log(`  Original: "${originalChunk.content.substring(0, 50)}..."`);
        console.log(`  Processed: "${processedChunk.content.substring(0, 50)}..."`);
        console.log(`  Page: ${processedChunk.pageNumber}, Start: ${processedChunk.startChar}, End: ${processedChunk.endChar}`);
      }
      
      // Generate embeddings in batches
      const BATCH_SIZE = 10; // OpenAI's recommended batch size
      const embeddingIds: string[] = [];
      
      for (let i = 0; i < processedChunks.length; i += BATCH_SIZE) {
        const batch = processedChunks.slice(i, i + BATCH_SIZE);
        console.log(`[FileEmbeddingService] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(processedChunks.length/BATCH_SIZE)}`);
        
        // Generate embeddings for the batch
        const startTime = Date.now();
        const embeddings = await this.embeddingManager.generateBatchEmbeddings(
          batch.map(chunk => chunk.content)
        );
        const duration = Date.now() - startTime;
        console.log(`[FileEmbeddingService] Generated ${batch.length} embeddings in ${duration}ms`);
        
        // Store embeddings in the database
        const batchInserts = batch.map((chunk, index) => ({
          file_id: file.id,
          embedding: embeddings[index],
          content: chunk.content,
          metadata: {
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            pageNumber: chunk.pageNumber,
            title: chunk.title,
            chunkIndex: i + index,
            totalChunks: processedChunks.length
          }
        }));
        
        const { data, error } = await client
          .from('file_embeddings')
          .insert(batchInserts)
          .select('id');
        
        if (error) {
          console.error(`[FileEmbeddingService] Error storing batch embeddings:`, error);
          continue;
        }
        
        embeddingIds.push(...data.map(item => item.id));
        console.log(`[FileEmbeddingService] Successfully stored ${data.length} embeddings for batch ${Math.floor(i/BATCH_SIZE) + 1}`);
      }
      
      // Update the file metadata to indicate embeddings are generated
      console.log(`[FileEmbeddingService] Updating file metadata with embedding information`);
      await client
        .from('files')
        .update({
          metadata: {
            ...file.metadata,
            embeddingsGenerated: true,
            embeddingsCount: embeddingIds.length,
            embeddingsGeneratedAt: new Date().toISOString(),
            hasNonLatinScripts
          }
        })
        .eq('id', file.id);
      
      console.log(`[FileEmbeddingService] Successfully generated and stored ${embeddingIds.length} embeddings for file: ${file.id}`);
      return embeddingIds;
    } catch (error) {
      console.error('[FileEmbeddingService] Error generating and storing file embeddings:', error);
      console.error('[FileEmbeddingService] Error stack:', (error as Error).stack);
      throw error;
    }
  }
  
  /**
   * Split text content into chunks for embedding
   * @param content Text content to split
   * @param options Chunking options
   * @returns Array of text chunks
   */
  private splitIntoChunks(
    content: string,
    options: { chunkSize: number; chunkOverlap: number; maxChunks: number }
  ): FileChunk[] {
    const chunks: FileChunk[] = [];
    const { chunkSize, chunkOverlap, maxChunks } = options;
    
    // Check if content is mainly non-Latin script (Hebrew, Arabic, etc.)
    const isNonLatinScript = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/.test(content.substring(0, 1000));
    
    // Check for page markers
    const hasPageMarkers = content.includes("==== Page");
    console.log(`[FileEmbeddingService] Content has page markers: ${hasPageMarkers}, Is non-Latin script: ${isNonLatinScript}`);
    
    // First try to split by page markers
    const pageMarkerRegex = /==== Page (\d+) ====/;
    const pageSections = content.split(/==== Page \d+ ====/);
    const pageNumbers: number[] = [];
    
    // Extract page numbers from the markers
    let match;
    const pageMarkerMatches = content.match(/==== Page \d+ ====/g) || [];
    pageMarkerMatches.forEach(marker => {
      match = pageMarkerRegex.exec(marker);
      if (match) {
        pageNumbers.push(parseInt(match[1], 10));
      }
    });
    
    console.log(`[FileEmbeddingService] Found ${pageSections.length} page sections and ${pageNumbers.length} page numbers`);
    
    // Handle case where page markers don't exist or are corrupted
    if (pageSections.length <= 1 || pageNumbers.length === 0) {
      console.log(`[FileEmbeddingService] No valid page markers found, treating as single page`);
      
      // If no page markers or they're corrupted, treat as a single page
      return this.splitContentSection(content, 0, 1, {
        chunkSize,
        chunkOverlap,
        maxChunks,
        isNonLatinScript
      });
    }
    
    // Process each page section
    let currentCharPosition = 0;
    let totalChunks = 0;
    
    // The first section is usually empty (before the first page marker)
    // Skip it if it's just whitespace
    let startIdx = pageSections[0].trim().length === 0 ? 1 : 0;
    
    for (let i = startIdx; i < pageSections.length; i++) {
      const pageContent = pageSections[i];
      if (!pageContent.trim()) {
        // Skip entirely empty pages
        currentCharPosition += pageContent.length;
        continue;
      }
      
      // Determine page number - use extracted number or position in array
      const pageNumber = pageNumbers[i - startIdx] || i;
      
      // Split this page's content
      const pageChunks = this.splitContentSection(
        pageContent, 
        currentCharPosition, 
        pageNumber,
        { chunkSize, chunkOverlap, maxChunks: maxChunks - totalChunks, isNonLatinScript }
      );
      
      chunks.push(...pageChunks);
      totalChunks += pageChunks.length;
      currentCharPosition += pageContent.length;
      
      // Check if we've reached the max chunks
      if (totalChunks >= maxChunks) {
        break;
      }
    }
    
    return chunks;
  }
  
  /**
   * Split a section of content into chunks
   * @param content Content section to split
   * @param startPosition Character position where this section begins
   * @param pageNumber Page number for this section
   * @param options Chunking options
   * @returns Array of chunks for this section
   */
  private splitContentSection(
    content: string,
    startPosition: number,
    pageNumber: number,
    options: { 
      chunkSize: number; 
      chunkOverlap: number; 
      maxChunks: number;
      isNonLatinScript: boolean 
    }
  ): FileChunk[] {
    const { chunkSize, chunkOverlap, maxChunks, isNonLatinScript } = options;
    const chunks: FileChunk[] = [];
    
    // If content is shorter than chunk size, return it as a single chunk
    if (content.length <= chunkSize) {
      return [{
        content: content,
        startChar: startPosition,
        endChar: startPosition + content.length,
        pageNumber
      }];
    }
    
    // Choose appropriate splitting strategy based on script type
    if (isNonLatinScript) {
      // For non-Latin scripts, use simpler splitting to avoid encoding issues
      return this.splitByFixedSize(content, startPosition, pageNumber, options);
    } else {
      // For Latin scripts, try to split by sentences
      return this.splitBySentences(content, startPosition, pageNumber, options);
    }
  }
  
  /**
   * Split content by sentences for Latin scripts
   */
  private splitBySentences(
    content: string,
    startPosition: number,
    pageNumber: number,
    options: { chunkSize: number; chunkOverlap: number; maxChunks: number; isNonLatinScript: boolean }
  ): FileChunk[] {
    const { chunkSize, chunkOverlap, maxChunks } = options;
    const chunks: FileChunk[] = [];
    
    // Split by sentences
    const sentences = content.split(/[.!?]+\s/);
    let currentChunk = '';
    let currentChunkStart = startPosition;
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk,
          startChar: currentChunkStart,
          endChar: currentChunkStart + currentChunk.length,
          pageNumber
        });
        
        // Start new chunk with overlap
        const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
        currentChunk = currentChunk.substring(overlapStart) + sentence;
        currentChunkStart = currentChunkStart + overlapStart;
        
        // Check if we've reached max chunks
        if (chunks.length >= maxChunks) {
          break;
        }
      } else {
        currentChunk += sentence;
      }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk.length > 0 && chunks.length < maxChunks) {
      chunks.push({
        content: currentChunk,
        startChar: currentChunkStart,
        endChar: currentChunkStart + currentChunk.length,
        pageNumber
      });
    }
    
    return chunks;
  }
  
  /**
   * Split content by fixed size for non-Latin scripts
   */
  private splitByFixedSize(
    content: string,
    startPosition: number,
    pageNumber: number,
    options: { chunkSize: number; chunkOverlap: number; maxChunks: number; isNonLatinScript: boolean }
  ): FileChunk[] {
    const { chunkSize, chunkOverlap, maxChunks } = options;
    const chunks: FileChunk[] = [];
    
    // For non-Latin scripts or when sentence splitting fails, use fixed-size chunks
    for (let i = 0; i < content.length && chunks.length < maxChunks; i += chunkSize - chunkOverlap) {
      const chunkStart = i;
      const chunkEnd = Math.min(i + chunkSize, content.length);
      const chunkContent = content.substring(chunkStart, chunkEnd);
      
      chunks.push({
        content: chunkContent,
        startChar: startPosition + chunkStart,
        endChar: startPosition + chunkEnd,
        pageNumber
      });
    }
    
    return chunks;
  }
  
  /**
   * Find relevant file sections by subject query
   * @param query Subject or topic query
   * @param fileId File ID to search within
   * @param options Search options
   * @returns Promise resolving to relevant file sections
   */
  async findRelevantSectionsBySubject(
    query: string,
    fileId: string,
    options?: { threshold?: number; limit?: number; token?: string }
  ): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
    try {
      // Get authenticated client if token is provided
      const client = options?.token ? await getAuthenticatedClient(options.token) : supabase;
      
      // Generate embedding for the query
      const embedding = await this.embeddingManager.generateEmbedding(query);
      
      // Search for matches in the file embeddings
      const { data, error } = await client.rpc('find_file_sections_by_subject', {
        subject_query: query,
        file_id_param: fileId,
        match_threshold: options?.threshold || 0.7,
        match_count: options?.limit || 5
      });
      
      if (error) {
        console.error('Error finding relevant sections:', error);
        return [];
      }
      
      // Use the content directly from the file_embeddings table
      const results = data.map((match: any) => {
        return {
          content: match.content || '',
          similarity: match.similarity,
          metadata: match.metadata
        };
      });
      
      // If any content is missing, fall back to extracting from original file
      const missingContent = results.some(result => !result.content);
      
      if (missingContent) {
        console.log('Some content missing from embeddings, falling back to file extraction');
        
        // Get the original file content to extract the matched sections
        const { data: fileMetadata, error: fileError } = await client
          .from('files')
          .select('*')
          .eq('id', fileId)
          .single();
        
        if (fileError || !fileMetadata) {
          console.error('Error retrieving file metadata:', fileError);
          return results.filter(r => r.content); // Return only results that have content
        }
        
        // Download and extract file content
        const fileContent = await this.getFileContent(fileMetadata, options?.token);
        
        // Update results with missing content
        return results.map(result => {
          if (!result.content && result.metadata) {
            const startChar = result.metadata.startChar || 0;
            const endChar = result.metadata.endChar || fileContent.length;
            result.content = fileContent.substring(startChar, endChar);
          }
          return result;
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error in findRelevantSectionsBySubject:', error);
      return [];
    }
  }
  
  /**
   * Get file content from storage
   * @param file File metadata
   * @param token Optional authentication token
   * @returns Promise resolving to file content
   */
  public async getFileContent(file: FileMetadata, token?: string): Promise<string> {
    try {
      // Get authenticated client if token is provided
      const client = token ? await getAuthenticatedClient(token) : supabase;
      
      // Determine the file path for download
      let filePath = this.extractFilePathFromUrl(file.url);
      
      if (!filePath) {
        throw new Error(`Could not extract file path from URL: ${file.url}`);
      }
      
      // Download the file
      let { data: fileData, error: downloadError } = await client.storage
        .from("files")
        .download(filePath);
      
      if (downloadError || !fileData) {
        // Try alternative path if the first one fails
        const altPath = `public/${filePath}`;
        
        const { data: altData, error: altError } = await client.storage
          .from("files")
          .download(altPath);
          
        if (altError || !altData) {
          throw new Error(`Could not download file: ${file.name}`);
        }
        
        fileData = altData;
      }
      
      // Get file extension and MIME type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const mimeType = this.getMimeTypeFromExtension(fileExtension);
      
      // Extract text content
      const arrayBuffer = await fileData.arrayBuffer();
      
      const extractedText = await extractTextFromFile(
        arrayBuffer,
        mimeType,
        file.name,
        { 
          language: file.metadata?.detectedLanguage || 'auto',
          addPageMarkers: true
        }
      );
      
      return extractedText;
    } catch (error) {
      console.error('Error getting file content:', error);
      throw error;
    }
  }
  
  /**
   * Extract file path from URL
   * @param url File URL
   * @returns Extracted file path
   */
  private extractFilePathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // The path usually follows the pattern /storage/v1/object/public/files/private/user_id/workspace_id/filename
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
   * Get MIME type from file extension
   * @param extension File extension
   * @returns MIME type
   */
  private getMimeTypeFromExtension(extension?: string): string {
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
   * Generate embeddings for a file in the background (non-blocking)
   * This method updates file metadata to track the embedding generation process
   * 
   * @param file File metadata
   * @param fileContent Extracted text content from the file
   * @param token Auth token for database updates
   */
  async generateEmbeddingsInBackground(
    file: FileMetadata, 
    fileContent: string, 
    token: string
  ): Promise<void> {
    try {
      console.log(`[FileEmbeddingService:Background] Starting background embedding generation for file: ${file.id}, name: "${file.name}"`);
      console.log(`[FileEmbeddingService:Background] Content length: ${fileContent.length} chars`);
      
      // Get authenticated client if token is provided
      const client = token ? await getAuthenticatedClient(token) : supabase;
      console.log(`[FileEmbeddingService:Background] Using ${token ? 'authenticated' : 'default'} Supabase client`);
      
      // Update the file metadata to indicate embeddings are being generated
      console.log(`[FileEmbeddingService:Background] Updating file metadata to indicate embedding generation started`);
      const { data: updateData, error: updateError } = await client
        .from('files')
        .update({
          metadata: {
            ...file.metadata,
            embeddingsGenerating: true
          }
        })
        .eq('id', file.id)
        .select('metadata');
      
      if (updateError) {
        console.error(`[FileEmbeddingService:Background] Error updating file metadata:`, updateError);
      } else {
        console.log(`[FileEmbeddingService:Background] File metadata updated:`, updateData?.[0]?.metadata);
      }
      
      // Generate and store embeddings
      console.log(`[FileEmbeddingService:Background] Calling generateAndStoreFileEmbeddings with options: chunkSize: 1800, overlap: 300, maxChunks: 200`);
      const startTime = Date.now();
      const embeddingIds = await this.generateAndStoreFileEmbeddings(
        file,
        fileContent,
        {
          chunkSize: 1800,  // Reduced from 2000 to create more granular chunks
          chunkOverlap: 300,
          maxChunks: 200,   // Increased from 50 to handle larger documents
          normalize: true
        },
        token
      );
      const duration = (Date.now() - startTime) / 1000; // in seconds
      
      console.log(`[FileEmbeddingService:Background] Successfully generated ${embeddingIds.length} embeddings for file: ${file.id} in ${duration.toFixed(1)} seconds`);
      
      // Update the file metadata with embedding information
      console.log(`[FileEmbeddingService:Background] Updating file metadata with embedding completion information`);
      const { data: finalUpdateData, error: finalUpdateError } = await client
        .from('files')
        .update({
          metadata: {
            ...file.metadata,
            embeddingsGenerating: false,
            embeddingsGenerated: true,
            embeddingsCount: embeddingIds.length,
            embeddingsGeneratedAt: new Date().toISOString(),
            embeddingsDuration: `${duration.toFixed(1)}s`
          }
        })
        .eq('id', file.id)
        .select('metadata');
      
      if (finalUpdateError) {
        console.error(`[FileEmbeddingService:Background] Error updating file metadata with completion info:`, finalUpdateError);
      } else {
        console.log(`[FileEmbeddingService:Background] Final file metadata updated:`, finalUpdateData?.[0]?.metadata);
      }
      
      console.log(`[FileEmbeddingService:Background] Background embedding generation completed for file: ${file.id}`);
        
    } catch (error) {
      console.error('[FileEmbeddingService:Background] Error generating embeddings in background:', error);
      console.error('[FileEmbeddingService:Background] Error stack:', (error as Error).stack);
      
      // Update the file metadata to indicate embedding generation failed
      try {
        console.log(`[FileEmbeddingService:Background] Updating file metadata to indicate embedding failure`);
        const client = token ? await getAuthenticatedClient(token) : supabase;
        const { error: failureUpdateError } = await client
          .from('files')
          .update({
            metadata: {
              ...file.metadata,
              embeddingsGenerating: false,
              embeddingsGenerated: false,
              embeddingsError: (error as Error).message,
              embeddingsErrorTime: new Date().toISOString()
            }
          })
          .eq('id', file.id);
          
        if (failureUpdateError) {
          console.error('[FileEmbeddingService:Background] Error updating metadata after failure:', failureUpdateError);
        } else {
          console.log('[FileEmbeddingService:Background] File metadata updated to reflect embedding failure');
        }
      } catch (updateError) {
        console.error('[FileEmbeddingService:Background] Error updating file metadata after embedding failure:', updateError);
      }
    }
  }
} 