import { AIServiceFactory, AIProviderType } from './AIServiceFactory';
import { AIService } from './AIService';

/**
 * Feature types for AI-powered functionality
 */
export type AIFeatureType = 
  | 'quiz_generation'       // Quiz generation feature
  | 'subject_extraction'    // Subject extraction from content
  | 'content_summarization' // Content summarization
  | 'quiz_explanation'      // Generating explanations for quiz answers
  | 'code_analysis'         // Code analysis for programming content
  | 'general_chat'          // General chat functionality
  | 'default';              // Default fallback provider

/**
 * Configuration for an AI provider and model
 */
export interface AIModelConfig {
  provider: AIProviderType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Service mapping features to specific AI configurations
 */
export class AIConfig {
  private static instance: AIConfig;
  private featureMap: Map<AIFeatureType, AIModelConfig>;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.featureMap = new Map<AIFeatureType, AIModelConfig>();
    this.initializeDefaults();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AIConfig {
    if (!AIConfig.instance) {
      AIConfig.instance = new AIConfig();
    }
    return AIConfig.instance;
  }
  
  /**
   * Sets up default providers for each feature
   */
  private initializeDefaults() {
    // Configure Claude for quiz generation (better factual accuracy and reasoning)
    this.featureMap.set('quiz_generation', {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.7,
    });
    
    // Configure Claude for subject extraction
    this.featureMap.set('subject_extraction', {
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307', // Faster, cheaper model for simpler task
      temperature: 0.3, // Lower temperature for more consistent results
    });
    
    // Configure Claude for content summarization
    this.featureMap.set('content_summarization', {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.4,
    });
    
    // Configure OpenAI for quiz explanations
    this.featureMap.set('quiz_explanation', {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    });
    
    // Configure OpenAI for code analysis
    this.featureMap.set('code_analysis', {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.2,
    });
    
    // Configure OpenAI for general chat
    this.featureMap.set('general_chat', {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.9,
    });
    
    // Default fallback
    this.featureMap.set('default', {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    });
  }
  
  /**
   * Gets the AI service for a specific feature
   * @param feature The feature requiring AI services
   * @returns Configured AI service for the feature
   */
  public getServiceForFeature(feature: AIFeatureType): AIService {
    // Get configuration for the feature, or fall back to default
    const config = this.featureMap.get(feature) || this.featureMap.get('default')!;
    
    // Create service instance
    const service = AIServiceFactory.createService(config.provider);
    
    // Configure the service with the specified model and parameters
    if (config.model) {
      (service as any).setDefaultModel(config.model);
    }
    
    return service;
  }
  
  /**
   * Updates configuration for a specific feature
   * @param feature Feature to update
   * @param config New configuration
   */
  public updateFeatureConfig(feature: AIFeatureType, config: AIModelConfig): void {
    this.featureMap.set(feature, config);
    console.log(`Updated AI configuration for ${feature}:`, config);
  }
  
  /**
   * Gets configuration for a specific feature
   * @param feature Feature to get configuration for
   * @returns Configuration object
   */
  public getFeatureConfig(feature: AIFeatureType): AIModelConfig | undefined {
    return this.featureMap.get(feature);
  }
  
  /**
   * Resets configuration for a specific feature to defaults
   * @param feature Feature to reset
   */
  public resetFeatureConfig(feature: AIFeatureType): void {
    // First clear the current config
    this.featureMap.delete(feature);
    
    // Then re-initialize defaults
    this.initializeDefaults();
    
    console.log(`Reset AI configuration for ${feature} to defaults`);
  }
} 