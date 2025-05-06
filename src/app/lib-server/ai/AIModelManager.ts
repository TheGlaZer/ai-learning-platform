import { AIModelConfig } from './AIConfig';
import { AIProviderType } from './AIServiceFactory';

/**
 * Model information including limits and capabilities
 */
export interface AIModelInfo {
  id: string;               // Model identifier (e.g., 'claude-3-5-haiku-20241022')
  displayName: string;      // Human-readable name (e.g., 'Claude 3.5 Haiku')
  provider: AIProviderType; // The AI provider (e.g., 'anthropic', 'openai')
  type?: string;            // Model type (e.g. 'chat', 'embedding')
  contextWindow: number;    // Max context window in tokens
  maxOutputTokens: number;  // Max output tokens
  isMultimodal: boolean;    // Whether the model supports images
  costPerInputMillion: number;  // Cost per million input tokens (USD)
  costPerOutputMillion: number; // Cost per million output tokens (USD)
  costPer1KInputTokens: number;  // Cost per 1K input tokens in USD
  costPer1KOutputTokens: number; // Cost per 1K output tokens in USD
  description?: string;     // Optional description of the model
}

/**
 * Central manager for AI model configurations
 */
export class AIModelManager {
  private static instance: AIModelManager;
  private models: Map<string, AIModelInfo>;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.models = new Map<string, AIModelInfo>();
    this.initializeModels();
    this.initializeEmbeddingModels();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AIModelManager {
    if (!AIModelManager.instance) {
      AIModelManager.instance = new AIModelManager();
    }
    return AIModelManager.instance;
  }
  
  /**
   * Initialize available models
   */
  private initializeModels() {
    // Anthropic Claude models
    this.models.set('claude-3-5-haiku-20241022', {
      id: 'claude-3-5-haiku-20241022',
      displayName: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      isMultimodal: true,
      costPerInputMillion: 0.80,
      costPerOutputMillion: 4.00,
      description: 'Fast model with 8K output capacity'
    });
    
    this.models.set('claude-3-5-sonnet-20240620', {
      id: 'claude-3-5-sonnet-20240620',
      displayName: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      isMultimodal: true,
      costPerInputMillion: 3.00,
      costPerOutputMillion: 15.00,
      description: 'Balanced speed and intelligence'
    });
    
    this.models.set('claude-3-opus-20240229', {
      id: 'claude-3-opus-20240229',
      displayName: 'Claude 3 Opus',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      isMultimodal: true,
      costPerInputMillion: 15.00,
      costPerOutputMillion: 75.00,
      description: 'Most powerful Claude 3 model'
    });
    
    this.models.set('claude-3-haiku-20240307', {
      id: 'claude-3-haiku-20240307',
      displayName: 'Claude 3 Haiku',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      isMultimodal: true,
      costPerInputMillion: 0.25,
      costPerOutputMillion: 1.25,
      description: 'Fastest Claude 3 model'
    });
    
    // OpenAI models
    this.models.set('gpt-4o', {
      id: 'gpt-4o',
      displayName: 'GPT-4o',
      provider: 'openai',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      isMultimodal: true,
      costPerInputMillion: 5.00,
      costPerOutputMillion: 15.00,
      description: 'Latest multimodal GPT model'
    });
    
    this.models.set('gpt-4o-mini', {
      id: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      provider: 'openai',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      isMultimodal: true,
      costPerInputMillion: 0.50,
      costPerOutputMillion: 1.50,
      description: 'Smaller, faster GPT-4o model'
    });
  }
  
  /**
   * Initialize embedding models
   * Adds embedding model configurations to the list
   */
  private initializeEmbeddingModels(): void {
    // Add OpenAI embedding models
    this.models.set('text-embedding-ada-002', {
      provider: 'openai',
      type: 'embedding',
      contextWindow: 8191,
      maxOutputTokens: 1536,
      costPer1KInputTokens: 0.0001,
      costPer1KOutputTokens: 0.0,
      description: 'Legacy OpenAI embedding model'
    });
    
    this.models.set('text-embedding-3-small', {
      provider: 'openai',
      type: 'embedding',
      contextWindow: 8191,
      maxOutputTokens: 1536,
      costPer1KInputTokens: 0.00002,
      costPer1KOutputTokens: 0.0,
      description: 'Efficient OpenAI embedding model with 1536 dimensions'
    });
    
    this.models.set('text-embedding-3-large', {
      provider: 'openai',
      type: 'embedding',
      contextWindow: 8191,
      maxOutputTokens: 3072,
      costPer1KInputTokens: 0.00013,
      costPer1KOutputTokens: 0.0,
      description: 'High-performance OpenAI embedding model with 3072 dimensions'
    });
  }
  
  /**
   * Gets information about a specific model
   * @param modelId The model ID to get information for
   * @returns Model information or undefined if not found
   */
  public getModelInfo(modelId: string): AIModelInfo | undefined {
    return this.models.get(modelId);
  }
  
  /**
   * Gets all available models
   * @param provider Optional provider filter
   * @returns Array of model information objects
   */
  public getAllModels(provider?: AIProviderType): AIModelInfo[] {
    const allModels = Array.from(this.models.values());
    
    if (provider) {
      return allModels.filter(model => model.provider === provider);
    }
    
    return allModels;
  }
  
  /**
   * Suggests the best model for a specific use case within budget constraints
   * @param tokens Estimated tokens needed for the task
   * @param provider Optional provider preference
   * @param budgetConstraint Optional budget constraint (low, medium, high)
   * @returns The suggested model
   */
  public suggestModel(
    outputTokens: number,
    provider?: AIProviderType,
    budgetConstraint?: 'low' | 'medium' | 'high'
  ): AIModelInfo {
    const candidateModels = this.getAllModels(provider);
    
    // Filter by budget if specified
    let filteredModels = candidateModels;
    if (budgetConstraint) {
      if (budgetConstraint === 'low') {
        filteredModels = candidateModels.filter(m => m.costPerOutputMillion <= 5);
      } else if (budgetConstraint === 'medium') {
        filteredModels = candidateModels.filter(m => m.costPerOutputMillion <= 20);
      }
      // For 'high' budget, no additional filtering needed
    }
    
    // Filter by output token capability
    const modelsWithSufficientTokens = filteredModels.filter(m => m.maxOutputTokens >= outputTokens);
    
    if (modelsWithSufficientTokens.length === 0) {
      // If no models meet token requirements, return the one with highest output capacity
      return filteredModels.sort((a, b) => b.maxOutputTokens - a.maxOutputTokens)[0];
    }
    
    // Return the cheapest model that meets the token requirements
    return modelsWithSufficientTokens.sort((a, b) => a.costPerOutputMillion - b.costPerOutputMillion)[0];
  }
  
  /**
   * Creates an AIModelConfig from a model ID
   * @param modelId The model ID to create a config for
   * @returns AIModelConfig object or undefined if model not found
   */
  public createConfigFromModel(modelId: string): AIModelConfig | undefined {
    const modelInfo = this.getModelInfo(modelId);
    
    if (!modelInfo) {
      return undefined;
    }
    
    return {
      provider: modelInfo.provider,
      model: modelInfo.id,
      temperature: 0.7, // Default temperature
    };
  }
} 