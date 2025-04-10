import { FileTypeProcessorOptions } from './types';
import { normalizeText } from './textProcessing';
import JSZip from 'jszip';
import { parseString } from 'xml2js';
import { promisify } from 'util';

// Promisify xml2js parseString function
const parseXml = promisify(parseString);

export async function processPptxFile(
  fileBuffer: ArrayBuffer,
  options: FileTypeProcessorOptions = {}
): Promise<string> {
  try {
    // Load the PPTX file with JSZip
    const zip = new JSZip();
    const pptx = await zip.loadAsync(fileBuffer);
    
    // Get all slide files
    const slideFiles = Object.keys(pptx.files).filter(
      filename => filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
    );
    
    // Sort slides by number
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      return numA - numB;
    });
    
    console.log(`Found ${slideFiles.length} slides in PPTX`);
    
    // Process each slide
    let allText = '';
    
    for (const slideFile of slideFiles) {
      const slideXml = await pptx.file(slideFile)?.async('text');
      if (!slideXml) continue;
      
      // Extract slide number
      const slideNumber = slideFile.match(/slide(\d+)\.xml/)?.[1] || '';
      
      try {
        // Parse the XML
        const result = await parseXml(slideXml);
        
        // Extract text elements from slide
        const slideText = extractTextFromSlide(result);
        
        // Add slide content to full text
        allText += `Slide ${slideNumber}:\n${slideText}\n\n`;
      } catch (xmlError) {
        console.warn(`Error parsing slide ${slideNumber}:`, xmlError);
      }
    }
    
    // Normalize and clean up text based on language
    return normalizeText(allText, options.language);
  } catch (error) {
    console.error('Error processing PPTX:', error);
    throw new Error(`PPTX processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Recursively extract text from slide XML structure
 */
function extractTextFromSlide(obj: any): string {
  if (!obj) return '';
  
  // If this is a string, return it
  if (typeof obj === 'string') return obj;
  
  // If it's the text node we're looking for
  if (obj['a:t']) {
    return Array.isArray(obj['a:t']) 
      ? obj['a:t'].join(' ') 
      : obj['a:t'].toString();
  }
  
  // If it's an array, process each element
  if (Array.isArray(obj)) {
    return obj.map(item => extractTextFromSlide(item)).join(' ');
  }
  
  // If it's an object, recursively process all properties
  if (typeof obj === 'object') {
    return Object.values(obj).map(val => extractTextFromSlide(val)).join(' ');
  }
  
  return '';
} 