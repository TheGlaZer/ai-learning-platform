// Export interfaces
export type { VectorEmbeddingService } from './VectorEmbeddingService';
export type { EmbeddingOptions, EmbeddingProviderType } from './EmbeddingManager';
export { EmbeddingManager } from './EmbeddingManager';

// Export implementations
export { OpenAIEmbeddingService } from './OpenAIEmbeddingService';
export { EmbeddingCache } from './EmbeddingCache';

// Import the manager for singleton initialization
import { EmbeddingManager } from './EmbeddingManager';

// Default export for easy access to the manager instance
export default EmbeddingManager.getInstance(); 