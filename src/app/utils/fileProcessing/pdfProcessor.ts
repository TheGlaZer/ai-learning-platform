import { FileTypeProcessorOptions } from './types';
import { normalizeText } from './textProcessing';
// Using pdf-parse library instead of pdf.js directly
import pdfParse from 'pdf-parse';

export async function processPdfFile(
  fileBuffer: ArrayBuffer,
  options: FileTypeProcessorOptions = {}
): Promise<string> {
  try {
    console.log(`PDF processor received buffer of length: ${fileBuffer.byteLength} bytes`);
    
    // Validate input buffer
    if (!fileBuffer || fileBuffer.byteLength === 0) {
      throw new Error('Empty or invalid file buffer provided to PDF processor');
    }
    
    // Convert ArrayBuffer to Buffer for pdf-parse
    const buffer = Buffer.from(fileBuffer);
    console.log(`Converted to Node.js Buffer of length: ${buffer.length} bytes`);
    
    // Set pdf-parse options
    const pdfOptions = {
      // Optional pdf-parse options
      max: options.maxPages || undefined,
      // Set a reasonable timeout (30 seconds)
      timeout: 30000
    };
    
    console.log(`Starting PDF parsing with options:`, pdfOptions);
    
    // Use pdf-parse to extract text
    const result = await pdfParse(buffer, pdfOptions);
    
    // Get the text content
    let fullText = result.text || '';
    
    console.log(`Processed PDF with ${result.numpages} pages, extracted ${fullText.length} characters`);
    
    // Check if we actually got content
    if (!fullText || fullText.trim().length === 0) {
      console.warn('PDF parsing returned empty text');
    }
    
    // Normalize and clean up text based on language
    return normalizeText(fullText, options.language);
  } catch (error) {
    console.error('Error processing PDF:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
} 