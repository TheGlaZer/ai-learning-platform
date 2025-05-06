import { FileEmbedding, EmbeddingCluster } from './types';

export class ClusteringService {
  /**
   * Cluster embeddings based on similarity
   */
  public async clusterEmbeddings(embeddings: FileEmbedding[]): Promise<EmbeddingCluster[]> {
    // Log the number of embeddings we're clustering
    console.log(`[ClusteringService] Clustering ${embeddings.length} embeddings`);
    
    const clusters: EmbeddingCluster[] = [];
    const visited = new Set<number>();
    
    // Basic algorithm: group embeddings that are similar enough
    for (let i = 0; i < embeddings.length; i++) {
      if (visited.has(i)) continue;
      
      visited.add(i);
      const cluster: EmbeddingCluster = {
        centroid: embeddings[i].embedding,
        members: [embeddings[i]],
        importance: 1 // Start with base importance
      };
      
      // Find similar embeddings
      for (let j = 0; j < embeddings.length; j++) {
        if (i === j || visited.has(j)) continue;
        
        // Calculate cosine similarity
        const similarity = this.calculateCosineSimilarity(
          embeddings[i].embedding,
          embeddings[j].embedding
        );
        
        // If similarity is above threshold, add to cluster
        // Use a lower threshold (0.60) for larger chunks
        if (similarity > 0.60) { // Lower threshold to accommodate larger chunks with more diverse content
          console.log(`######### [ClusteringService] Adding embedding ${j} to cluster with ${cluster.members.length} members`);
          visited.add(j);
          cluster.members.push(embeddings[j]);
          cluster.importance += 1; // Increase importance for each member
        }
      }
      
      // Log cluster size
      console.log(`[ClusteringService] Created cluster with ${cluster.members.length} members`);
      
      clusters.push(cluster);
    }
    
    // Sort clusters by importance (size)
    const sortedClusters = clusters.sort((a, b) => b.importance - a.importance);
    
    // Log final cluster stats
    console.log(`[ClusteringService] Created ${sortedClusters.length} clusters from ${embeddings.length} embeddings`);
    console.log(`[ClusteringService] Largest cluster has ${sortedClusters[0]?.members.length || 0} members`);
    
    return sortedClusters;
  }
  
  /**
   * Calculate cosine similarity between two embedding vectors
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
} 