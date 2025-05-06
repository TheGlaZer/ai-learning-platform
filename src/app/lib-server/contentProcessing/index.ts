// Export base interfaces and types
export type { 
  ContentProcessor, 
  ProcessingOptions,
  ProcessingResult
} from './ContentProcessor';

// Export text processing components
export { TextProcessor } from './TextProcessor';
export type { TextProcessingOptions } from './TextProcessor';

// Export file processing components
export { FileProcessor } from './FileProcessor';
export type { 
  FileProcessingOptions,
  FileProcessingResult
} from './FileProcessor';

// Create default processor instances
import { TextProcessor } from './TextProcessor';
import { FileProcessor } from './FileProcessor';

export const textProcessor = new TextProcessor();
export const fileProcessor = new FileProcessor();

// Default export for easier imports
export default {
  textProcessor,
  fileProcessor
}; 