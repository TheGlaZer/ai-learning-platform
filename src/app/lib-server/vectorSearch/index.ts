// Export interfaces and types
export type { SearchOptions, SearchResult, VectorSearchService } from './VectorSearchService';

// Export implementations
export { PostgresVectorSearch } from './PostgresVectorSearch';

// Create default vector search service instance
import { PostgresVectorSearch } from './PostgresVectorSearch';
const defaultVectorSearch = new PostgresVectorSearch();

// Default export for convenient access
export default defaultVectorSearch; 