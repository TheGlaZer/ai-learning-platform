import { FileTypeProcessorOptions } from './types';
import { normalizeText } from './textProcessing';
import mammoth from 'mammoth';

export async function processDocxFile(
  fileBuffer: ArrayBuffer,
  options: FileTypeProcessorOptions = {}
): Promise<string> {
  try {
    console.log(`DOCX processor received buffer of length: ${fileBuffer.byteLength} bytes`);
    
    // Validate input buffer
    if (!fileBuffer || fileBuffer.byteLength === 0) {
      throw new Error('Empty or invalid file buffer provided to DOCX processor');
    }
    
    // Convert ArrayBuffer to Buffer for mammoth
    const buffer = Buffer.from(fileBuffer);
    console.log(`Converted to Node.js Buffer of length: ${buffer.length} bytes`);
    
    // Try different approaches to extract text
    let result;
    let text = '';
    
    try {
      // First approach: pass as arrayBuffer
      console.log('Trying mammoth.extractRawText with arrayBuffer option...');
      result = await mammoth.extractRawText({
        arrayBuffer: fileBuffer
      });
      text = result.value;
      console.log('First approach succeeded');
    } catch (firstError) {
      console.warn('First approach with arrayBuffer failed:', firstError);
      
      try {
        // Second approach: try with Buffer
        console.log('Attempting second approach with buffer...');
        result = await mammoth.extractRawText({
          buffer: buffer
        });
        text = result.value;
        console.log('Second approach succeeded');
      } catch (secondError) {
        console.warn('Second approach with buffer failed:', secondError);
        
        try {
          // Third approach: try using convertToHtml as fallback
          console.log('Attempting third approach with convertToHtml...');
          const htmlResult = await mammoth.convertToHtml({
            buffer: buffer
          });
          
          // Strip HTML tags for plain text
          text = htmlResult.value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          console.log('Third approach succeeded (converted from HTML)');
        } catch (thirdError) {
          console.error('All approaches failed:', thirdError);
          throw new Error('All DOCX extraction methods failed');
        }
      }
    }
    
    // Log processing info
    console.log(`Processed DOCX document, extracted ${text.length} characters`);
    
    // Check if we actually got content
    if (!text || text.trim().length === 0) {
      console.warn('DOCX processing returned empty text');
    }
    
    // Normalize and clean up text based on language
    return normalizeText(text, options.language);
  } catch (error) {
    console.error('Error processing DOCX:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error(`DOCX processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
} 