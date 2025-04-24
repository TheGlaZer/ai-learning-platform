import { FileTypeProcessorOptions } from './types';
import { normalizeText } from './textProcessing';
import mammoth from 'mammoth';
import JSZip from 'jszip';

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
    
    // Try to directly detect page breaks from document structure first
    try {
      console.log('Attempting to extract pages directly from DOCX structure...');
      const pageTexts = await extractPagesFromDocx(fileBuffer);
      
      if (pageTexts && pageTexts.length > 0) {
        console.log(`Successfully extracted ${pageTexts.length} pages from DOCX structure`);
        
        // Format the pages with markers
        const result = pageTexts.map((text, index) => 
          `------ PAGE: ${index + 1} ----------\n${text.trim()}`
        ).join('\n\n');
        
        return normalizeText(result, options.language);
      }
    } catch (structureError) {
      console.warn('Failed to extract pages from document structure:', structureError);
    }
    
    // Fallback to standard mammoth extraction
    console.log('Falling back to standard text extraction...');
    let result;
    try {
      result = await mammoth.extractRawText({
        buffer: buffer
      });
      
      const text = `------ PAGE: 1 ----------\n${result.value}`;
      console.log('Standard extraction successful');
      
      return normalizeText(text, options.language);
    } catch (extractError) {
      console.error('Text extraction failed:', extractError);
      throw new Error('DOCX extraction failed');
    }
  } catch (error) {
    console.error('Error processing DOCX:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error(`DOCX processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract pages from DOCX by analyzing the document structure directly
 * This looks for page break elements in the document.xml file
 */
async function extractPagesFromDocx(fileBuffer: ArrayBuffer): Promise<string[]> {
  // Load the DOCX file with JSZip (DOCX is a ZIP containing XML files)
  const zip = new JSZip();
  const docx = await zip.loadAsync(fileBuffer);
  
  // Read the document content
  const contentXml = await docx.file("word/document.xml")?.async("text");
  if (!contentXml) {
    throw new Error("Could not read document.xml from DOCX file");
  }
  
  // Split content into paragraphs
  const paragraphs = contentXml.split("<w:p ");
  
  // Initialize variables for page tracking
  const pages: string[] = [""];
  let currentPage = 0;
  
  // Process each paragraph to extract text and detect page breaks
  for (let i = 1; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    
    // Check if paragraph contains a page break
    const hasPageBreak = paragraph.includes('w:break w:type="page"');
    
    // Extract text from paragraph using regex
    const textMatches = paragraph.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (textMatches) {
      // Get the text content from the matches
      const paragraphText = textMatches.map(match => {
        // Extract the content between the <w:t> tags
        const content = match.replace(/<w:t[^>]*>(.*?)<\/w:t>/g, "$1");
        // Convert XML entities
        return content
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
      }).join("");
      
      // Add text to current page
      if (paragraphText.trim()) {
        pages[currentPage] += paragraphText.trim() + "\n";
      }
    }
    
    // If this paragraph had a page break, start a new page
    if (hasPageBreak) {
      currentPage++;
      pages[currentPage] = "";
    }
  }
  
  // Filter out empty pages and return the result
  return pages.filter(page => page.trim().length > 0);
} 