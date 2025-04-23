import { FileTypeProcessorOptions } from './types';
import { normalizeText } from './textProcessing';
import pdfParse from 'pdf-parse';

// This file is used in a server context only
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
    
    // Store pages separately
    let pages: string[] = [];
    
    // Set pdf-parse options with custom page renderer
    const pdfOptions = {
      // Optional pdf-parse options
      max: options.maxPages || undefined,
      // Set a reasonable timeout (30 seconds)
      timeout: 30000,
      // Custom page renderer that adds page markers
      pagerender: function(pageData: any) {
        const pageNumber = pageData.pageIndex + 1;
        
        return pageData.getTextContent()
          .then(function(textContent: any) {
            let text = textContent.items.map((item: any) => item.str).join(" ");
            
            // Store this page's text with its page number
            pages[pageNumber-1] = `------ PAGE: ${pageNumber} ----------\n${text}`;
            
            return text;
          });
      }
    };
    
    console.log(`Starting PDF parsing with options:`, pdfOptions);
    
    // Use pdf-parse to extract text
    const result = await pdfParse(buffer, pdfOptions);
    
    // If the page renderer worked, use the collected pages
    let fullText = '';
    
    if (pages.length > 0) {
      fullText = pages.join('\n\n');
    } else {
      // Fallback to using the full text with a single page marker
      fullText = `------ PAGE: 1 ----------\n${result.text || ''}`;
    }
    
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