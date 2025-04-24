/**
 * Normalizes text by removing excess whitespace and handling language-specific cleanup
 * @param text The text to normalize
 * @param language The language of the text (defaults to auto-detect)
 * @returns Normalized text
 */
export function normalizeText(text: string, language?: string): string {
  if (!text) return '';
  
  // Basic normalization (universal)
  let normalized = text
    .replace(/\r\n/g, '\n')         // Standardize line endings
    .replace(/\t/g, ' ')           // Convert tabs to spaces
    .replace(/\s+/g, ' ')          // Collapse multiple spaces
    .replace(/\n\s*\n+/g, '\n\n')  // Collapse multiple empty lines
    .trim();                       // Remove leading/trailing whitespace
  
  // Language-specific processing
  const detectedLanguage = language || detectLanguage(normalized);
  
  if (detectedLanguage === 'he') {
    // Fix Hebrew text direction and specific characters
    normalized = handleHebrewText(normalized);
  }
  
  return normalized;
}

/**
 * Special handling for Hebrew text
 * @param text The Hebrew text to process
 * @returns Processed text
 */
function handleHebrewText(text: string): string {
  // Ensure right-to-left text is properly preserved
  // This adds RTL marker to the beginning of each paragraph if it contains Hebrew
  const rtlMarker = '\u202B'; // Right-to-Left Embedding character
  
  // Check if the text contains Hebrew
  const containsHebrew = /[\u0590-\u05FF\uFB1D-\uFB4F]/.test(text);
  
  if (containsHebrew) {
    // Add RTL markers to the beginning of each paragraph containing Hebrew
    return text
      .split('\n')
      .map(line => {
        if (/[\u0590-\u05FF\uFB1D-\uFB4F]/.test(line)) {
          return rtlMarker + line;
        }
        return line;
      })
      .join('\n');
  }
  
  return text;
}

/**
 * Detects the probable language of a text
 * @param text The text to analyze
 * @returns Language code ('en', 'he', etc.) or 'unknown'
 */
export function detectLanguage(text: string): string {
  if (!text || text.length < 10) return 'unknown';
  
  // Simple language detection based on character sets
  // Hebrew has unique Unicode range
  const hebrewRegex = /[\u0590-\u05FF\uFB1D-\uFB4F]/;
  
  // Check if the text contains Hebrew characters
  const hebrewCharCount = (text.match(hebrewRegex) || []).length;
  const totalCharCount = text.replace(/\s/g, '').length;
  
  // If there are Hebrew characters and they make up more than 2% of the content,
  // classify as Hebrew. This is more sensitive to detect mixed content files with Hebrew.
  if (hebrewCharCount > 0 && (hebrewCharCount / totalCharCount) > 0.02) {
    console.log(`Detected Hebrew language: ${hebrewCharCount} Hebrew chars out of ${totalCharCount} total (${((hebrewCharCount/totalCharCount)*100).toFixed(2)}%)`);
    return 'he';
  }
  
  // Default to English for non-Hebrew text
  console.log('Detected English language (default)');
  return 'en';
} 