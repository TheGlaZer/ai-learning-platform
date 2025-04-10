import { AIService } from './AIService';
import { OpenAIService } from './OpenAIService';
import { AnthropicService } from './AnthropicService';

export type AIProviderType = 'openai' | 'azure' | 'anthropic' | 'gemini' | 'other';

export class AIServiceFactory {
  static createService(providerType: AIProviderType, apiKey?: string): AIService {
    switch (providerType) {
      case 'openai':
        return new OpenAIService(apiKey);
      case 'anthropic':
        return new AnthropicService(apiKey);
      case 'gemini':
        console.log('Gemini service not fully implemented, using OpenAI with fallback settings');
        // Using OpenAI with different model as temporary fallback
        return new OpenAIService(apiKey || process.env.OPENAI_API_KEY_TERTIARY);
      // In future these can be proper implementations:
      // case 'azure':
      //   return new AzureOpenAIService(apiKey);
      // case 'gemini': 
      //   return new GeminiService(apiKey);
      default:
        return new OpenAIService(apiKey);
    }
  }

  /**
   * Creates a fallback service when the primary service fails
   * @param primaryProviderType The provider type that failed
   * @param apiKey Optional API key
   * @returns A fallback AIService implementation
   */
  static createFallbackService(primaryProviderType: AIProviderType, apiKey?: string): AIService {
    // Don't fall back to the same service type
    if (primaryProviderType === 'openai') {
      console.log('Creating fallback service using Anthropic (primary was OpenAI)');
      return new AnthropicService(process.env.ANTHROPIC_API_KEY);
    } else {
      console.log('Creating fallback service using OpenAI (primary was non-OpenAI)');
      return new OpenAIService(apiKey || process.env.OPENAI_API_KEY);
    }
  }
}