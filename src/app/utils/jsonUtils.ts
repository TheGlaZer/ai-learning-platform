/**
 * Utility functions for handling JSON operations with better error handling
 */

/**
 * Safely parses JSON strings with robust error handling and cleaning
 * This is particularly useful for parsing AI responses that might contain
 * unexpected formatting, additional text, or syntax errors.
 * 
 * @param content - The string content to parse as JSON
 * @returns Parsed JSON object
 * @throws Error if parsing fails after all recovery attempts
 */
export function safeParseJSON<T = Record<string, unknown>>(content: string): T {
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid input: content must be a non-empty string');
  }

  // Step 1: Clean the response content
  let cleanedContent = content;
  
  // Remove markdown code blocks if present
  cleanedContent = cleanedContent.replace(/```json\s*/g, '');
  cleanedContent = cleanedContent.replace(/```\s*/g, '');
  
  // Remove any additional text before or after the JSON object/array
  const jsonStartIdx = Math.min(
    cleanedContent.indexOf('{') >= 0 ? cleanedContent.indexOf('{') : Infinity,
    cleanedContent.indexOf('[') >= 0 ? cleanedContent.indexOf('[') : Infinity
  );
  
  const jsonEndIdx = Math.max(
    cleanedContent.lastIndexOf('}') >= 0 ? cleanedContent.lastIndexOf('}') : -1,
    cleanedContent.lastIndexOf(']') >= 0 ? cleanedContent.lastIndexOf(']') : -1
  );
  
  if (jsonStartIdx >= 0 && jsonEndIdx >= 0 && jsonEndIdx > jsonStartIdx) {
    cleanedContent = cleanedContent.substring(jsonStartIdx, jsonEndIdx + 1);
  }
  
  // Trim whitespace
  cleanedContent = cleanedContent.trim();
  
  try {
    // Try standard JSON parsing first
    return JSON.parse(cleanedContent) as T;
  } catch (parseError) {
    console.error('Standard JSON parsing failed, attempting to fix common issues:', parseError);
    
    try {
      // Fix common JSON syntax errors
      const fixedContent = fixCommonJSONErrors(cleanedContent);
      return JSON.parse(fixedContent) as T;
    } catch (fixedParseError) {
      console.error('Failed to parse JSON even after fixing common errors:', fixedParseError);
      console.error('Original content sample:', content.substring(0, 500) + (content.length > 500 ? '...' : ''));
      console.error('Cleaned content sample:', cleanedContent.substring(0, 500) + (cleanedContent.length > 500 ? '...' : ''));
      throw new Error('Failed to parse JSON: Invalid syntax after all repair attempts');
    }
  }
}

/**
 * Attempts to fix common JSON syntax errors
 * 
 * @param content - The JSON string to fix
 * @returns A fixed JSON string
 */
function fixCommonJSONErrors(content: string): string {
  let fixed = content;
  
  // Replace single quotes with double quotes (only for key/value pairs)
  fixed = fixed.replace(/([{,]\s*)\'([^']+)\'(\s*:)/g, '$1"$2"$3');
  fixed = fixed.replace(/([:][\s]*)\'([^']+)\'([},])/g, '$1"$2"$3');
  
  // Fix trailing commas in objects
  fixed = fixed.replace(/,\s*}/g, '}');
  
  // Fix trailing commas in arrays
  fixed = fixed.replace(/,\s*\]/g, ']');
  
  // Fix missing quotes around string property names
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3');
  
  // Fix unquoted values that should be strings
  fixed = fixed.replace(/:(\s*)([a-zA-Z][a-zA-Z0-9_$]*)([\s,}])/g, ':"$2"$3');
  
  return fixed;
} 