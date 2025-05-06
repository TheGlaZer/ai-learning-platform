export interface FileEmbedding {
  id: string;
  file_id?: string;
  chunk_index: number;
  content: string;
  embedding: number[];
  metadata?: {
    chunkIndex?: number;
    startChar?: number;
    endChar?: number;
    pageNumber?: number;
    totalChunks?: number;
    [key: string]: any;
  };
}

export interface EmbeddingCluster {
  centroid: number[];
  members: FileEmbedding[];
  importance: number;
}

export interface Subject {
  name: string;
  importance: string;
  file_id: string;
}

export interface SubjectGenerationResult {
  success: boolean;
  subjects?: Subject[];
  error?: string;
} 