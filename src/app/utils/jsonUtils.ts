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
    
    // Log the position of the error for debugging
    const errorMsg = (parseError as Error).message || '';
    const positionMatch = errorMsg.match(/position (\d+)/);
    if (positionMatch && positionMatch[1]) {
      const errorPosition = parseInt(positionMatch[1]);
      console.error(`Error occurred near position ${errorPosition}`);
      console.error(`Content around error: "${cleanedContent.substring(Math.max(0, errorPosition - 50), Math.min(cleanedContent.length, errorPosition + 50))}"`);
    }
    
    try {
      // Attempt first-level JSON fixes for common errors
      let fixedContent = fixCommonJSONErrors(cleanedContent);
      
      try {
        return JSON.parse(fixedContent) as T;
      } catch (firstFixError) {
        console.error('First-level fixes failed, attempting RTL-specific fixes');
        
        // Try RTL-specific fixes for Hebrew content
        fixedContent = fixRTLSpecificIssues(fixedContent);
        
        try {
          return JSON.parse(fixedContent) as T;
        } catch (rtlFixError) {
          console.error('RTL fixes failed, attempting aggressive recovery');
          
          // Try more aggressive recovery for severely broken JSON
          const recoveryResult = attemptJsonRecovery(cleanedContent);
          
          // If recovery returned a pre-parsed object, return it directly
          if (typeof recoveryResult !== 'string') {
            return recoveryResult as unknown as T;
          }
          
          // Last attempt with the recovered string
          return JSON.parse(recoveryResult) as T;
        }
      }
    } catch (allFixesError) {
      console.error('Failed to parse JSON after all recovery attempts:', allFixesError);
      console.error('Original content sample:', content.substring(0, 500) + (content.length > 500 ? '...' : ''));
      console.error('Cleaned content sample:', cleanedContent.substring(0, 500) + (cleanedContent.length > 500 ? '...' : ''));
      
      // Create a simple JSON structure with the error information
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
  
  // Fix escaped quotation marks within strings
  fixed = fixed.replace(/\\"/g, '"').replace(/(?<!\\)"/g, '\\"').replace(/\\\\"/g, '\\"');
  
  return fixed;
}

/**
 * Attempts more aggressive recovery for severely broken JSON
 * This is a last resort when other fixes fail
 * 
 * @param content - The broken JSON string
 * @returns Either a fixed JSON string or a parsed object if recovery was successful
 */
function attemptJsonRecovery(content: string): string | Record<string, any> {
  try {
    // Remove all control characters and zero-width characters that can break parsing
    let cleanString = content.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E]/g, '');
    
    // Try to balance braces and brackets if they're uneven
    const openBraces = (cleanString.match(/{/g) || []).length;
    const closeBraces = (cleanString.match(/}/g) || []).length;
    const openBrackets = (cleanString.match(/\[/g) || []).length;
    const closeBrackets = (cleanString.match(/\]/g) || []).length;
    
    // Add missing closing braces
    if (openBraces > closeBraces) {
      cleanString += '}'.repeat(openBraces - closeBraces);
    }
    
    // Add missing closing brackets
    if (openBrackets > closeBrackets) {
      cleanString += ']'.repeat(openBrackets - closeBrackets);
    }
    
    // As a last resort, try to construct a valid JSON by extracting just the questions
    // Use non-greedy matching to find the questions array
    const questionsMatch = content.match(/"questions"\s*:\s*\[([\s\S]+?)\](?=\s*[,}])/);
    if (questionsMatch && questionsMatch[1]) {
      try {
        const questionsPart = `{"questions":[${questionsMatch[1]}]}`;
        return JSON.parse(questionsPart) as Record<string, any>;
      } catch {
        // Failed to parse questions part, continue with other recovery attempts
      }
    }
    
    return cleanString;
  } catch (recoveryError) {
    console.error('Recovery attempt failed:', recoveryError);
    return '{"error": "JSON recovery failed", "recoveryFailed": true}';
  }
}

/**
 * Fixes issues specifically related to RTL text in JSON
 * 
 * @param content - The JSON string with potential RTL issues
 * @returns A fixed JSON string
 */
function fixRTLSpecificIssues(content: string): string {
  let fixed = content;
  
  // Fix escaped Unicode RTL markers which can cause parsing issues
  fixed = fixed.replace(/\\u202B/g, ''); // Remove RLE (Right-to-Left Embedding)
  fixed = fixed.replace(/\\u202E/g, ''); // Remove RLO (Right-to-Left Override)
  fixed = fixed.replace(/\\u202A/g, ''); // Remove LRE (Left-to-Right Embedding)
  fixed = fixed.replace(/\\u202D/g, ''); // Remove LRO (Left-to-Right Override)
  fixed = fixed.replace(/\\u202C/g, ''); // Remove PDF (Pop Directional Formatting)
  
  // Fix unescaped quotes within Hebrew strings
  const hebrewStringRegex = /"([^"]*[\u0590-\u05FF][^"]*)"/g;
  fixed = fixed.replace(hebrewStringRegex, (match, hebrewText) => {
    // Manually escape any unescaped double quotes within the Hebrew text
    let fixedText = '';
    for (let i = 0; i < hebrewText.length; i++) {
      if (hebrewText[i] === '"' && (i === 0 || hebrewText[i-1] !== '\\')) {
        fixedText += '\\"';
      } else {
        fixedText += hebrewText[i];
      }
    }
    return `"${fixedText}"`;
  });
  
  return fixed;
} 