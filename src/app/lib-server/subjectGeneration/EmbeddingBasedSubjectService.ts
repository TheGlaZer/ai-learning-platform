import { supabase, getAuthenticatedClient } from '../supabaseClient';
import { ClusteringService } from './ClusteringService';
import { SubjectExtractionService } from './SubjectExtractionService';
import { Subject, SubjectGenerationResult, FileEmbedding, EmbeddingCluster } from './types';
import { FileEmbeddingService } from '../FileEmbeddingService';

export class EmbeddingBasedSubjectService {
  private clusteringService: ClusteringService;
  private subjectExtractionService: SubjectExtractionService;
  private fileEmbeddingService: FileEmbeddingService;

  constructor() {
    this.clusteringService = new ClusteringService();
    this.subjectExtractionService = new SubjectExtractionService();
    this.fileEmbeddingService = new FileEmbeddingService();
  }

  /**
   * Generate subjects for a file using embeddings
   */
  public async generateSubjectsFromEmbeddings(
    fileId: string,
    token?: string
  ): Promise<SubjectGenerationResult> {
    try {
      console.log(`[EmbeddingBasedSubjectService] Generating subjects for file ID: ${fileId}`);
      const client = token ? await getAuthenticatedClient(token) : supabase;
      
      // Step 1: Get file embeddings
      const { data: embeddings, error } = await client
        .from('file_embeddings')
        .select('id, file_id, content, embedding, metadata')
        .eq('file_id', fileId)
        .order('metadata->chunkIndex', { ascending: true });
      
      if (error || !embeddings || embeddings.length === 0) {
        console.error('[EmbeddingBasedSubjectService] Failed to retrieve embeddings or none exist:', error);
        return { 
          success: false, 
          error: 'No embeddings found for this file' 
        };
      }
      
      console.log(`[EmbeddingBasedSubjectService] Found ${embeddings.length} embeddings for file`);
      
      // Check for potential issues with text encoding in non-Latin languages
      console.log(`[EmbeddingBasedSubjectService] Sample content from first few embeddings:`);
      for (let i = 0; i < Math.min(3, embeddings.length); i++) {
        const embedding = embeddings[i];
        console.log(`  Embedding ${i} (chunk ${embedding.metadata?.chunkIndex}):`);
        console.log(`    Content: "${embedding.content?.substring(0, 100)}..."`);
        console.log(`    Start/End: ${embedding.metadata?.startChar}-${embedding.metadata?.endChar}`);
        console.log(`    Page: ${embedding.metadata?.pageNumber}`);
      }

      // Check if there are encoding or content issues in the embeddings
      const hasHebrewContent = embeddings.some(
        embedding => embedding.content && /[\u0590-\u05FF]/.test(embedding.content)
      );
      
      console.log(`[EmbeddingBasedSubjectService] Content contains Hebrew: ${hasHebrewContent}`);
      
      // Get file details to check language and encoding
      const { data: fileData, error: fileError } = await client
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();
      
      // Get language from file metadata if available
      const fileLanguage = fileData?.metadata?.detectedLanguage;
      console.log(`[EmbeddingBasedSubjectService] File language from metadata: ${fileLanguage || 'not specified'}`);
      
      // Transform the embeddings to include the chunk_index from metadata
      const transformedEmbeddings = embeddings.map(embedding => ({
        ...embedding,
        chunk_index: embedding.metadata?.chunkIndex || 0
      }));
      
      // Step 2: Cluster the embeddings
      console.log('[EmbeddingBasedSubjectService] Clustering embeddings...');
      const clusters = await this.clusteringService.clusterEmbeddings(transformedEmbeddings);
      
      // Check if clusters were properly formed
      if (clusters.length === embeddings.length) {
        console.log('[EmbeddingBasedSubjectService] Warning: Each embedding is its own cluster. Clustering wasn\'t effective.');
        
        // Force re-clustering of some embeddings to create fewer clusters
        // Use an approach that groups sequential chunks when they might be related
        const forcedClusters = this.forceCreateFewClusters(transformedEmbeddings, clusters);
        console.log(`[EmbeddingBasedSubjectService] Reduced to ${forcedClusters.length} clusters by force-grouping related content`);
        
        // Step 3: Extract subjects from the forced clusters
        console.log('[EmbeddingBasedSubjectService] Extracting subjects from forced-grouped clusters...');
        const subjects = await this.subjectExtractionService.extractSubjects(forcedClusters, fileId);
        console.log(`[EmbeddingBasedSubjectService] Generated ${subjects.length} subjects in a single batch`);
        
        // Print out the subjects for debugging
        subjects.forEach((subject, i) => {
          console.log(`  Subject ${i+1}: "${subject.name}" (Importance: ${subject.importance})`);
        });
        
        return {
          success: true,
          subjects
        };
      }
      
      console.log(`[EmbeddingBasedSubjectService] Created ${clusters.length} natural clusters`);
      
      // Use the top clusters but ensure diversity by sampling across the document
      const selectedClusters = this.selectDiverseClusters(clusters, 10);
      console.log(`[EmbeddingBasedSubjectService] Selected ${selectedClusters.length} diverse clusters for subject extraction`);
      
      // Step 3: Extract subjects from clusters
      console.log('[EmbeddingBasedSubjectService] Extracting subjects from clusters using batched AI request...');
      const subjects = await this.subjectExtractionService.extractSubjects(selectedClusters, fileId);
      console.log(`[EmbeddingBasedSubjectService] Generated ${subjects.length} subjects in a single batch`);
      
      // Print out the subjects for debugging
      subjects.forEach((subject, i) => {
        console.log(`  Subject ${i+1}: "${subject.name}" (Importance: ${subject.importance})`);
      });
      
      return {
        success: true,
        subjects
      };
    } catch (error) {
      console.error('[EmbeddingBasedSubjectService] Error generating subjects from embeddings:', error);
      return {
        success: false,
        error: `Failed to generate subjects: ${error}`
      };
    }
  }
  
  /**
   * Force create a smaller number of clusters from embeddings
   * Used when normal clustering doesn't work well
   */
  private forceCreateFewClusters(
    embeddings: FileEmbedding[], 
    originalClusters: EmbeddingCluster[]
  ): EmbeddingCluster[] {
    // Sort embeddings by chunk index
    const sortedEmbeddings = [...embeddings].sort(
      (a, b) => (a.metadata?.chunkIndex || 0) - (b.metadata?.chunkIndex || 0)
    );
    
    // Create groups of 5-7 sequential embeddings (fewer groups since chunks are larger now)
    const groupSize = Math.max(5, Math.ceil(sortedEmbeddings.length / 8));
    const forcedClusters: EmbeddingCluster[] = [];
    
    for (let i = 0; i < sortedEmbeddings.length; i += groupSize) {
      const memberEmbeddings = sortedEmbeddings.slice(i, i + groupSize);
      
      // Create a new cluster
      const cluster: EmbeddingCluster = {
        centroid: memberEmbeddings[0].embedding, // Use first embedding as centroid
        members: memberEmbeddings,
        importance: memberEmbeddings.length
      };
      
      forcedClusters.push(cluster);
    }
    
    // Sort by importance
    return forcedClusters.sort((a, b) => b.importance - a.importance);
  }
  
  /**
   * Select diverse clusters from across the document
   * This ensures we get subjects from different parts of the document
   */
  private selectDiverseClusters(
    clusters: EmbeddingCluster[],
    maxClusters: number
  ): EmbeddingCluster[] {
    if (clusters.length <= maxClusters) {
      return clusters;
    }
    
    // First, get the top 3 most important clusters
    const topImportantClusters = clusters.slice(0, 3);
    
    // For the rest, try to select clusters with members from different parts of the document
    // Get average chunk index for each cluster
    const clusterInfo = clusters.slice(3).map((cluster, index) => {
      const avgChunkIndex = cluster.members.reduce(
        (sum, member) => sum + (member.metadata?.chunkIndex || 0), 
        0
      ) / cluster.members.length;
      
      return {
        cluster,
        avgChunkIndex,
        originalIndex: index + 3
      };
    });
    
    // Sort by average chunk index to get clusters from different parts of the document
    clusterInfo.sort((a, b) => a.avgChunkIndex - b.avgChunkIndex);
    
    // Select clusters at regular intervals to ensure coverage across the document
    const step = Math.max(1, Math.floor(clusterInfo.length / (maxClusters - 3)));
    const selectedClustersInfo = [];
    
    for (let i = 0; i < clusterInfo.length && selectedClustersInfo.length < (maxClusters - 3); i += step) {
      selectedClustersInfo.push(clusterInfo[i]);
    }
    
    // Sort back by original importance
    selectedClustersInfo.sort((a, b) => a.originalIndex - b.originalIndex);
    
    // Combine top important clusters with diverse clusters
    return [...topImportantClusters, ...selectedClustersInfo.map(info => info.cluster)];
  }
} 