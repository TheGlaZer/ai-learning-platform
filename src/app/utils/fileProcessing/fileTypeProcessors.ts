import { FileTypeProcessorMap, FileTypeProcessorOptions } from './types';
import { processPdfFile } from './pdfProcessor';
import { processDocxFile } from './docxProcessor';
import { processPptxFile } from './pptxProcessor';
import mammoth from 'mammoth';
import { normalizeText } from './textProcessing';

// Direct handler for DOCX that tries multiple approaches
const handleDocx = async (buffer: ArrayBuffer, options: FileTypeProcessorOptions = {}): Promise<string> => {
  console.log('Using enhanced DOCX handler');
  
  try {
    // Convert to Node Buffer
    const nodeBuffer = Buffer.from(buffer);
    
    // Try multiple approaches
    let rawText = '';
    
    try {
      // First, try the simplest approach - extractRawText with arrayBuffer
      console.log('DOCX: Trying extractRawText with arrayBuffer');
      const result = await mammoth.extractRawText({
        arrayBuffer: buffer
      });
      rawText = result.value;
      console.log(`DOCX: Successfully extracted ${rawText.length} characters via arrayBuffer approach`);
    } catch (err1) {
      console.warn('DOCX: First approach failed, trying with buffer', err1);
      
      // Then try with buffer
      try {
        console.log('DOCX: Trying extractRawText with buffer');
        const result = await mammoth.extractRawText({
          buffer: nodeBuffer
        });
        rawText = result.value;
        console.log(`DOCX: Successfully extracted ${rawText.length} characters via buffer approach`);
      } catch (err2) {
        console.warn('DOCX: Second approach failed, trying convertToHtml', err2);
        
        // Last resort - try HTML conversion and strip tags
        const result = await mammoth.convertToHtml({
          buffer: nodeBuffer
        });
        
        // Strip HTML tags
        rawText = result.value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`DOCX: Got ${rawText.length} characters via HTML conversion`);
      }
    }
    
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Failed to extract any text from DOCX file');
    }
    
    // Normalize the text using the same function as the regular processor
    return normalizeText(rawText, options.language);
    
  } catch (error) {
    console.error('All DOCX extraction methods failed:', error);
    throw new Error(`Enhanced DOCX handler failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helper for text file processing
const processTextFile = async (buffer: ArrayBuffer, options: FileTypeProcessorOptions = {}): Promise<string> => {
  const text = new TextDecoder().decode(buffer);
  console.log(`Text file processor extracted ${text.length} characters`);
  return normalizeText(text, options.language);
};

// Map of MIME types to their respective processors
export const fileTypeProcessors: FileTypeProcessorMap = {
  // PDF files
  'application/pdf': processPdfFile,
  
  // Word documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': handleDocx,
  'application/msword': handleDocx,
  
  // PowerPoint presentations
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': processPptxFile,
  'application/vnd.ms-powerpoint': processPptxFile,
  
  // Text files - handle directly with normalization
  'text/plain': processTextFile,
  'text/html': processTextFile,
  'application/json': processTextFile,
}; 