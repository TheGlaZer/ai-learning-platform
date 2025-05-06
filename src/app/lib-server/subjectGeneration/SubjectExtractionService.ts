import { EmbeddingCluster, Subject } from './types';
import { AIServiceFactory } from '../ai/AIServiceFactory';
import { AIConfig } from '../ai/AIConfig';
import { detectLanguage } from '@/app/utils/fileProcessing/textProcessing';

export class SubjectExtractionService {
  /**
   * Extract subjects from embedding clusters
   */
  public async extractSubjects(
    clusters: EmbeddingCluster[],
    fileId: string
  ): Promise<Subject[]> {
    // Limit the number of clusters to process (top N by importance)
    const topClusters = clusters.slice(0, 10);
    
    // If we have no clusters, return empty array
    if (topClusters.length === 0) {
      return [];
    }
    
    // Extract the representative content from each cluster for the batch request
    const clusterContents = topClusters.map(cluster => {
      console.log('[SubjectExtractionService] processing cluster with members:', cluster.members.length);
      // For each cluster, use the first member's content as representative
      // Ensure we handle nulls safely (though they shouldn't occur with our fixes)
      const content = cluster.members[0].content || 'No content available';
      return content.substring(0, 1200); // Increase limit to handle larger chunks
    });
    
    // Detect language from the first significant cluster content
    const significantContent = clusterContents.find(content => content.length > 100) || clusterContents[0];
    const detectedLanguage = await detectLanguage(significantContent);
    console.log(`[SubjectExtractionService] Detected language: ${detectedLanguage}`);
    
    // Generate all subject titles in a single batch request
    const subjectTitles = await this.generateSubjectTitlesBatch(clusterContents, detectedLanguage);
    
    // Create the subjects with the generated titles
    const subjects: Subject[] = topClusters.map((cluster, index) => ({
      name: subjectTitles[index] || `Subject ${index + 1}`,
      importance: this.mapImportanceScore(cluster.importance),
      file_id: fileId
    }));
    
    return subjects;
  }
  
  /**
   * Generate multiple subject titles in a single AI request
   */
  private async generateSubjectTitlesBatch(contentSections: string[], detectedLanguage: string): Promise<string[]> {
    try {
      // Use AI service for the 'subject_extraction' feature from config
      const aiConfig = AIConfig.getInstance();
      const aiService = aiConfig.getServiceForFeature('subject_extraction');
      
      // Log which service and model we're using
      const featureConfig = aiConfig.getFeatureConfig('subject_extraction');
      console.log(`[SubjectExtractionService] Using ${featureConfig?.provider} with model ${featureConfig?.model || 'default'} for language: ${detectedLanguage}`);
      
      // Build a prompt that includes language-specific instructions
      let prompt = '';
      
      // Add language-specific instructions
      if (detectedLanguage === 'he' || /[\u0590-\u05FF]/.test(contentSections[0])) {
        console.log('[SubjectExtractionService] Using Hebrew-specific instructions');
        prompt = `
        VERY IMPORTANT: Create ALL the subjects in HEBREW LANGUAGE ONLY.
        This is absolutely critical - your response MUST be in HEBREW, not English.
        The subject titles must be in Hebrew, with Hebrew characters, written right-to-left.
        Make sure the subject names are grammatically correct in Hebrew and culturally appropriate.
        DO NOT translate to English - generate native Hebrew subject names directly.
        NEVER output English text in your response - ONLY Hebrew is acceptable.
        
        For each of the following text sections, generate a concise subject title (2-5 words) that best describes the main topic or concept.
        Focus on creating accurate academic subject titles that would be appropriate for educational content.
        The titles should be short but descriptive, capturing the essence of each section.
        
        Return only the Hebrew subject titles, one per line, in the same order as the input sections.
        Do not include numbers, bullets, or any other formatting - just the Hebrew subject titles.
        
        Text sections:
        ${contentSections.map((content, i) => `Section ${i+1}:\n${content}\n`).join('\n')}
        
        Output only the Hebrew subject titles, one per line:`;
      } else {
        // Default prompt for other languages (English, etc.)
        prompt = `
        Generate concise subject titles (2-5 words each) that best describe each of the following text sections.
        Focus on the main topic or concept in each section. Keep titles short but descriptive.
        Create academic subject titles that would be appropriate for educational content.
        
        Return only the titles, one per line, in the same order as the input sections.
        Do not include numbers, bullets, or any other formatting - just the titles.
        
        Text sections:
        ${contentSections.map((content, i) => `Section ${i+1}:\n${content}\n`).join('\n')}
        
        Subject Titles (one per line):`;
      }
      
      // Send request to AI service
      const response = await aiService.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 500, // Increased for multiple titles
        language: detectedLanguage // Pass the detected language
      });
      
      // Parse the response to get individual titles
      const titles = response.content
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[0-9]+[\.\):-]*\s*/, '')) // Remove numbering if present
        .map(line => line.replace(/^"/, '').replace(/"$/, '')); // Remove quotes
      
      console.log(`[SubjectExtractionService] Generated ${titles.length} titles in language: ${detectedLanguage}`);
      titles.forEach((title, i) => console.log(`  Title ${i+1}: "${title}"`));
      
      // Ensure we have a title for each section (fill with defaults if needed)
      if (titles.length < contentSections.length) {
        console.warn(`Expected ${contentSections.length} titles but only got ${titles.length}`);
        
        // Fill missing titles with defaults
        for (let i = titles.length; i < contentSections.length; i++) {
          titles.push(detectedLanguage === 'he' ? `נושא ${i + 1}` : `Subject ${i + 1}`);
        }
      }
      
      return titles.slice(0, contentSections.length); // Ensure we return exactly what we need
    } catch (error) {
      console.error('Error generating subject titles in batch:', error);
      // Return default titles in case of error
      return contentSections.map((_, i) => 
        detectedLanguage === 'he' ? `נושא ${i + 1}` : `Subject ${i + 1}`
      );
    }
  }
  
  /**
   * Map importance score to a user-friendly label
   */
  private mapImportanceScore(score: number): string {
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }
} 